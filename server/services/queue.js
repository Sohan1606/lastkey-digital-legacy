const { Queue, Worker, QueueEvents } = require('bullmq');
const Redis = require('ioredis');

const redisEnabled = process.env.REDIS_ENABLED === 'true';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  // BullMQ requires this to be null.
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  lazyConnect: true, // Don't connect immediately
};

// Create Redis client with error handling
const redisClient = redisEnabled ? new Redis(redisConnection) : null;

if (redisClient) {
  redisClient.on('error', (err) => {
    // Silently handle Redis errors - they're expected when Redis is not available
    if (err && err.code === 'ECONNREFUSED') return;
    console.error('Redis error:', err?.message || err);
  });
}

// Queue definitions with error handling
let guardianQueue, capsuleQueue, emailQueue, guardianEvents;

try {
  if (redisEnabled) {
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
  } else {
    guardianQueue = null;
    capsuleQueue = null;
    emailQueue = null;
    guardianEvents = null;
  }
} catch (err) {
  console.warn('Queue initialization failed - Redis not available:', err.message);
  // Set to null so workers can handle the fallback
  guardianQueue = null;
  capsuleQueue = null;
  emailQueue = null;
  guardianEvents = null;
}

module.exports = { guardianQueue, capsuleQueue, emailQueue, redisConnection, redisClient };
