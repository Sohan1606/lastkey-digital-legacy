const { Worker } = require('bullmq');
const { capsuleQueue, redisConnection } = require('../services/queue');
const Capsule = require('../models/Capsule');
const Beneficiary = require('../models/Beneficiary');
const User = require('../models/User');
const { sendEmailWithRetry } = require('../services/emailService');

// Only create worker if queue is available (Redis is running)
let capsuleWorker = null;
if (capsuleQueue) {
  capsuleWorker = new Worker('capsule-release', async (job) => {
  const { capsuleId } = job.data;

  const capsule = await Capsule.findById(capsuleId);
  if (!capsule || capsule.isReleased) {
    console.log(`Capsule ${capsuleId} already released or not found`);
    return;
  }

  capsule.isReleased = true;
  capsule.releasedAt = new Date();
  await capsule.save();

  console.log(`Released capsule: ${capsule.title}`);

  const user = await User.findById(capsule.userId);
  const beneficiaries = await Beneficiary.find({ userId: capsule.userId });

  for (const b of beneficiaries) {
    await sendEmailWithRetry({
      to: b.email,
      subject: `A time capsule has been unlocked for you`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
          <h2 style="color:#00e5a0">Time Capsule Unlocked</h2>
          <p>A time capsule from <strong>${user?.name || 'A loved one'}</strong> is now available for you.</p>
          <h3 style="color:#4f9eff">${capsule.title}</h3>
          <div style="background:rgba(255,255,255,0.05);padding:20px;border-radius:12px;margin:16px 0">
            <p style="font-style:italic">"${capsule.message}"</p>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/emergency"
             style="background:linear-gradient(135deg,#00e5a0,#4f9eff);color:#001a12;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700">
            Open Legacy Portal
          </a>
        </div>
      `,
    });
  }

  if (global.io) {
    global.io.to(`user:${capsule.userId.toString()}`).emit('capsule-released', {
      id: capsule._id,
      title: capsule.title,
    });
  }
}, {
  connection: redisConnection,
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});

capsuleWorker.on('completed', (job) => console.log(`Capsule job ${job.id} completed`));
capsuleWorker.on('failed', (job, err) => console.error(`Capsule job ${job?.id} failed:`, err.message));

} // Close the if block for capsuleQueue

module.exports = capsuleWorker; // Will be null if Redis is not available
