const { guardianQueue } = require('./queue');

/**
 * Schedules or reschedules a user's guardian protocol jobs.
 * Call this whenever user.lastActive is updated.
 */
exports.scheduleGuardianJobs = async (user) => {
  if (!guardianQueue) {
    // Redis/BullMQ disabled or unavailable; server falls back to cron in development.
    return;
  }
  const userId = user._id.toString();
  // Convert days to milliseconds (inactivityDuration is stored in days)
  const inactivityMs = user.inactivityDuration * 24 * 60 * 60 * 1000;

  // Remove existing jobs for this user
  const existingWarning = await guardianQueue.getJob(`warning-${userId}`);
  const existingTrigger = await guardianQueue.getJob(`trigger-${userId}`);
  if (existingWarning) await existingWarning.remove();
  if (existingTrigger) await existingTrigger.remove();

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
};

/**
 * Cancels all pending guardian jobs for a user.
 * Call this when user pings (checks in).
 */
exports.cancelGuardianJobs = async (userId) => {
  if (!guardianQueue) {
    // Redis/BullMQ disabled or unavailable; nothing to cancel.
    return;
  }
  const warningJob = await guardianQueue.getJob(`warning-${userId}`);
  const triggerJob = await guardianQueue.getJob(`trigger-${userId}`);
  
  if (warningJob) await warningJob.remove();
  if (triggerJob) await triggerJob.remove();
};
