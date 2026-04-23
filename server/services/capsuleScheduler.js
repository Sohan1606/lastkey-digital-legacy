const { capsuleQueue } = require('./queue');

exports.scheduleCapsuleRelease = async (capsule) => {
  if (!capsuleQueue) {
    // Redis/BullMQ disabled or unavailable; capsule scheduling will rely on fallback mechanisms.
    return;
  }
  const delay = new Date(capsule.unlockAt) - Date.now();
  if (delay <= 0) {
    // Already past due \u2014 release immediately
    await capsuleQueue.add(`release-${capsule._id}`,
      { capsuleId: capsule._id.toString() },
      { jobId: `release-${capsule._id}`, removeOnComplete: 100 }
    );
  } else {
    await capsuleQueue.add(`release-${capsule._id}`,
      { capsuleId: capsule._id.toString() },
      { delay, jobId: `release-${capsule._id}`, removeOnComplete: 100 }
    );
  }
};
