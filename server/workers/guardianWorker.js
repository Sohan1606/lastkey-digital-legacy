const { Worker } = require('bullmq');
const { guardianQueue, redisConnection } = require('../services/queue');
const crypto = require('crypto');
const User = require('../models/User');
const Beneficiary = require('../models/Beneficiary');
const Asset = require('../models/Asset');
const BeneficiaryAccess = require('../models/BeneficiaryAccess');
const { sendEmailWithRetry } = require('../services/emailService');

// Only create worker if queue is available (Redis is running)
let guardianWorker = null;
if (guardianQueue) {
  guardianWorker = new Worker('guardian-protocol', async (job) => {
  const { userId, type } = job.data;

  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  const now = new Date();
  const inactiveMs = now - new Date(user.lastActive);
  const inactiveMinutes = inactiveMs / (1000 * 60);


  if (type === 'warning') {
    // Send warning email
    await sendEmailWithRetry({
      to: user.email,
      subject: 'LastKey: Inactivity Warning \u2014 Please Check In',
      html: buildWarningEmail(user),
    });
    
    await User.findByIdAndUpdate(userId, { triggerStatus: 'warning' });

    // Emit socket event
    if (global.io) {
      global.io.to(`user:${userId.toString()}`).emit('dms-update', {
        userId,
        status: 'warning',
        message: 'Inactivity warning — please check in',
        remainingMinutes: user.inactivityDuration - Math.floor(inactiveMinutes),
      });
    }

  } else if (type === 'trigger') {
    // Only trigger if still inactive (user may have checked in since job was queued)
    if (inactiveMinutes < user.inactivityDuration * 2) {
      return;
    }

    await User.findByIdAndUpdate(userId, { triggerStatus: 'triggered' });

    const beneficiaries = await Beneficiary.find({ userId });

    for (const beneficiary of beneficiaries) {
      // Generate cryptographically secure token (SECURITY LAYER 6: 64 bytes = 128 char hex)
      const token = crypto.randomBytes(64).toString('hex');

      // Get assigned vault items for this beneficiary
      const assignedItems = await Asset.find({
        ownerId: user._id,
        _id: { $in: beneficiary.assignedVaultItems || [] }
      });

      // Create access record
      const access = await BeneficiaryAccess.create({
        token,
        beneficiaryId: beneficiary._id,
        ownerId: user._id,
        assignedItems: assignedItems.map(item => item._id),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Send email with portal link
      const portalUrl = `${getPortalUrl()}/portal/${token}`;

      await sendEmailWithRetry({
        to: beneficiary.email,
        subject: 'LastKey: Guardian Protocol Activated',
        html: buildNewTriggerEmail(user, beneficiary, portalUrl, assignedItems.length),
      });
    }

    if (global.io) {
      global.io.to(`user:${userId.toString()}`).emit('dms-update', {
        userId,
        status: 'triggered',
        message: 'Guardian Protocol has been activated',
      });
    }
  }
}, {
  connection: redisConnection,
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});

guardianWorker.on('completed', (job) => {
  // Job completed
});

guardianWorker.on('failed', (job, err) => {
  console.error(`Guardian job ${job?.id} failed:`, err.message);
});

} // Close the if block for guardianQueue

const buildWarningEmail = (user) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
    <h2 style="color:#ffb830;margin-bottom:16px">Inactivity Warning</h2>
    <p>Hi ${user.name},</p>
    <p>We noticed you haven't checked in for a while. Your Guardian Protocol will activate if you don't respond.</p>
    <p style="margin:24px 0">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
         style="background:linear-gradient(135deg,#4f9eff,#7c5cfc);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700">
        I'm Here \u2014 Check In Now
      </a>
    </p>
    <p style="color:#8899bb;font-size:13px">If you don't respond within ${user.inactivityDuration} days, your legacy will be delivered to your beneficiaries.</p>
  </div>
`;

const getPortalUrl = () => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return baseUrl.replace(/\/$/, ''); // Remove trailing slash
};

const buildTriggerEmail = (user, beneficiary) => {
  const portalUrl = `${getPortalUrl()}/beneficiary-portal`;
  const enrollmentToken = beneficiary.enrollmentToken;

  // If beneficiary hasn't enrolled yet, include enrollment token
  const accessUrl = enrollmentToken
    ? `${portalUrl}?enroll=${enrollmentToken}`
    : portalUrl;

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
    <h2 style="color:#ff4d6d;margin-bottom:16px">Guardian Protocol Activated</h2>
    <p>Dear ${beneficiary.name},</p>
    <p><strong>${user.name}</strong> has set up a digital legacy for you and has been inactive for an extended period.</p>
    <p>Their Guardian Protocol has been automatically activated. You can now access their legacy.</p>
    <p style="margin:24px 0">
      <a href="${accessUrl}"
         style="background:linear-gradient(135deg,#ff4d6d,#7c5cfc);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">
        ${enrollmentToken ? 'Enroll & Access Legacy' : 'Access Legacy Portal'}
      </a>
    </p>
    <p style="color:#8899bb;font-size:13px">Your relationship: ${beneficiary.relationship} | Access level: ${beneficiary.accessLevel}</p>
    ${enrollmentToken ? `<p style="color:#ff6b6b;font-size:12px;margin-top:16px">This is a one-time enrollment link. Please save your credentials securely.</p>` : ''}
  </div>
`;
};

const buildNewTriggerEmail = (user, beneficiary, portalUrl, itemCount) => {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
    <h2 style="color:#ff4d6d;margin-bottom:16px">Guardian Protocol Activated</h2>
    <p>Dear ${beneficiary.name},</p>
    <p><strong>${user.name}</strong> has been inactive for an extended period.</p>
    <p>Their LastKey Digital Legacy has been <strong>activated</strong>.</p>
    <p><strong>${itemCount} items</strong> have been left for you.</p>
    <p style="margin:24px 0">
      <a href="${portalUrl}"
         style="background:linear-gradient(135deg,#4f9eff,#7c5cfc);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">
        Access Your Items
      </a>
    </p>
    <p style="color:#8899bb;font-size:12px">This link expires in 30 days.</p>
    <p style="color:#8899bb;font-size:13px">Your relationship: ${beneficiary.relationship}</p>
  </div>
`;
};

module.exports = guardianWorker; // Will be null if Redis is not available
