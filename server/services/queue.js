const { Queue, Worker, QueueEvents } = require('bullmq');
const Redis = require('ioredis');

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3, // Limit retry attempts
  retryDelayOnFailover: 100,
  lazyConnect: true, // Don't connect immediately
};

// Create Redis client with error handling
const redisClient = new Redis(redisConnection);

redisClient.on('error', (err) => {
  // Silently handle Redis errors - they're expected when Redis is not available
  if (err.code === 'ECONNREFUSED') {
    // Expected error when Redis is not running
    return;
  }
  console.error('Redis error:', err.message);
});

// Queue definitions with error handling
let guardianQueue, capsuleQueue, emailQueue, guardianEvents;

try {
  guardianQueue = new Queue('guardian-protocol', { 
    connection: redisConnection,
    settings: {
      stalledInterval: 30 * 1000,
      maxStalledCount: 1,
    }
  });
  capsuleQueue = new Queue('capsule-release', { connection: redisConnection });
  emailQueue = new Queue('email-delivery', { connection: redisConnection });

  // Queue events for monitoring
  guardianEvents = new QueueEvents('guardian-protocol', { connection: redisConnection });
  guardianEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`Guardian job ${jobId} failed: ${failedReason}`);
  });
} catch (err) {
  console.warn('Queue initialization failed - Redis not available:', err.message);
  // Set to null so workers can handle the fallback
  guardianQueue = null;
  capsuleQueue = null;
  emailQueue = null;
  guardianEvents = null;
}

module.exports = { guardianQueue, capsuleQueue, emailQueue, redisConnection, redisClient };
