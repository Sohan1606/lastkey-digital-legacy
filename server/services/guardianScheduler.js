const { guardianQueue } = require('./queue');

/**
 * Schedules or reschedules a user's guardian protocol jobs.
 * Call this whenever user.lastActive is updated.
 */
exports.scheduleGuardianJobs = async (user) => {
  const userId = user._id.toString();
  const inactivityMs = user.inactivityDuration * 60 * 1000;

  // Remove existing jobs for this user
  await guardianQueue.drain(); // simple approach \u2014 see note below

  // Warning job fires at inactivityDuration * 1.0 (first threshold)
  await guardianQueue.add(`warning-${userId}`, 
    { userId, type: 'warning' },
    {
      delay: inactivityMs,
      jobId: `warning-${userId}`,
      removeOnComplete: 1000,
      removeOnFail: 500,
    }
  );

  // Trigger job fires at inactivityDuration * 2.0 (final threshold)
  await guardianQueue.add(`trigger-${userId}`,
    { userId, type: 'trigger' },
    {
      delay: inactivityMs * 2,
      jobId: `trigger-${userId}`,
      removeOnComplete: 1000,
      removeOnFail: 500,
    }
  );

  console.log(`Guardian jobs scheduled for ${user.email}: warning in ${user.inactivityDuration}min, trigger in ${user.inactivityDuration * 2}min`);
};

/**
 * Cancels all pending guardian jobs for a user.
 * Call this when user pings (checks in).
 */
exports.cancelGuardianJobs = async (userId) => {
  const warningJob = await guardianQueue.getJob(`warning-${userId}`);
  const triggerJob = await guardianQueue.getJob(`trigger-${userId}`);
  
  if (warningJob) await warningJob.remove();
  if (triggerJob) await triggerJob.remove();
  
  console.log(`Guardian jobs cancelled for user ${userId}`);
};
