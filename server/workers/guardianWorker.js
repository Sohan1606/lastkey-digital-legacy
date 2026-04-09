const { Worker } = require('bullmq');
const { guardianQueue, redisConnection } = require('../services/queue');
const User = require('../models/User');
const Beneficiary = require('../models/Beneficiary');
const { sendEmailWithRetry } = require('../services/emailService');

// Only create worker if queue is available (Redis is running)
let guardianWorker = null;
if (guardianQueue) {
  guardianWorker = new Worker('guardian-protocol', async (job) => {
  const { userId, type } = job.data;

  const user = await User.findById(userId);
  if (!user) {
    console.log(`Guardian job: user ${userId} not found, skipping`);
    return;
  }

  const now = new Date();
  const inactiveMs = now - new Date(user.lastActive);
  const inactiveMinutes = inactiveMs / (1000 * 60);

  console.log(`Guardian check: ${user.email}, inactive ${Math.floor(inactiveMinutes)}min`);

  if (type === 'warning') {
    // Send warning email
    await sendEmailWithRetry({
      to: user.email,
      subject: 'LastKey: Inactivity Warning \u2014 Please Check In',
      html: buildWarningEmail(user),
    });
    
    await User.findByIdAndUpdate(userId, { triggerStatus: 'warning' });
    console.log(`Warning sent to ${user.email}`);

    // Emit socket event
    if (global.io) {
      global.io.to(userId.toString()).emit('dms-update', {
        userId,
        status: 'warning',
        message: 'Inactivity warning \u2014 please check in',
        remainingMinutes: user.inactivityDuration - Math.floor(inactiveMinutes),
      });
    }

  } else if (type === 'trigger') {
    // Only trigger if still inactive (user may have checked in since job was queued)
    if (inactiveMinutes < user.inactivityDuration * 2) {
      console.log(`User ${user.email} became active, cancelling trigger`);
      return;
    }

    await User.findByIdAndUpdate(userId, { triggerStatus: 'triggered' });
    console.log(`TRIGGERED for ${user.email}`);

    const beneficiaries = await Beneficiary.find({ userId });
    for (const b of beneficiaries) {
      await sendEmailWithRetry({
        to: b.email,
        subject: 'LastKey: Guardian Protocol Activated',
        html: buildTriggerEmail(user, b),
      });
    }

    if (global.io) {
      global.io.to(userId.toString()).emit('dms-update', {
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
  console.log(`Guardian job ${job.id} completed`);
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
    <p style="color:#8899bb;font-size:13px">If you don't respond within ${user.inactivityDuration} minutes, your legacy will be delivered to your beneficiaries.</p>
  </div>
`;

const buildTriggerEmail = (user, beneficiary) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
    <h2 style="color:#ff4d6d;margin-bottom:16px">Guardian Protocol Activated</h2>
    <p>Dear ${beneficiary.name},</p>
    <p><strong>${user.name}</strong> has set up a digital legacy for you and has been inactive for an extended period.</p>
    <p>Their Guardian Protocol has been automatically activated. You can now access their legacy.</p>
    <p style="margin:24px 0">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/emergency"
         style="background:linear-gradient(135deg,#ff4d6d,#7c5cfc);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700">
        Access Legacy Portal
      </a>
    </p>
    <p style="color:#8899bb;font-size:13px">Your relationship: ${beneficiary.relationship} | Access level: ${beneficiary.accessLevel}</p>
  </div>
`;

module.exports = guardianWorker; // Will be null if Redis is not available
