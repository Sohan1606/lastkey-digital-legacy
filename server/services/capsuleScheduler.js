const { capsuleQueue } = require('./queue');

exports.scheduleCapsuleRelease = async (capsule) => {
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
    console.log(`Capsule ${capsule.title} scheduled to release in ${Math.floor(delay/1000/60)}min`);
  }
};
