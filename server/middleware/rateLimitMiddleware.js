/**
 * Rate Limiting Middleware
 * 
 * Provides configurable rate limiting for API endpoints to prevent abuse
 * and ensure fair usage. Supports different strategies and configurations.
 */

const rateLimitStore = new Map();

/**
 * In-memory rate limiter
 * For production, consider using Redis or another persistent store
 */
class MemoryRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.max = options.max || 100; // Limit each IP to 100 requests per windowMs
    this.message = options.message || 'Too many requests from this IP, please try again later.';
    this.standardHeaders = options.standardHeaders !== false;
    this.legacyHeaders = options.legacyHeaders !== false;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
  }

  defaultKeyGenerator(req) {
    // Use IP address as the default key
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           'unknown';
  }

  middleware() {
    return (req, res, next) => {
      const key = this.keyGenerator(req);
      const now = Date.now();
      const windowStart = now - this.windowMs;

      // Get or create rate limit data for this key
      let record = rateLimitStore.get(key);
      
      if (!record) {
        record = {
          requests: [],
          totalRequests: 0
        };
        rateLimitStore.set(key, record);
      }

      // Clean up old requests outside the window
      record.requests = record.requests.filter(timestamp => timestamp > windowStart);

      // Check if limit exceeded
      if (record.requests.length >= this.max) {
        const resetTime = Math.ceil((record.requests[0] + this.windowMs) / 1000);
        
        // Set rate limit headers
        if (this.standardHeaders) {
          res.set('RateLimit-Limit', this.max);
          res.set('RateLimit-Remaining', Math.max(0, this.max - record.requests.length));
          res.set('RateLimit-Reset', resetTime);
        }
        
        if (this.legacyHeaders) {
          res.set('X-RateLimit-Limit', this.max);
          res.set('X-RateLimit-Remaining', Math.max(0, this.max - record.requests.length));
          res.set('X-RateLimit-Reset', resetTime);
        }

        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: this.message,
          retryAfter: Math.ceil((record.requests[0] + this.windowMs - now) / 1000),
          rateLimit: {
            limit: this.max,
            current: record.requests.length,
            remaining: Math.max(0, this.max - record.requests.length),
            resetTime: resetTime
          }
        });
      }

      // Add current request timestamp
      record.requests.push(now);
      record.totalRequests++;

      // Set rate limit headers for successful requests
      if (this.standardHeaders) {
        res.set('RateLimit-Limit', this.max);
        res.set('RateLimit-Remaining', Math.max(0, this.max - record.requests.length));
        res.set('RateLimit-Reset', Math.ceil((now + this.windowMs) / 1000));
      }
      
      if (this.legacyHeaders) {
        res.set('X-RateLimit-Limit', this.max);
        res.set('X-RateLimit-Remaining', Math.max(0, this.max - record.requests.length));
        res.set('X-RateLimit-Reset', Math.ceil((now + this.windowMs) / 1000));
      }

      // Clean up old records periodically
      if (record.totalRequests % 100 === 0) {
        this.cleanup();
      }

      next();
    };
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [key, record] of rateLimitStore.entries()) {
      // Remove requests outside the window
      record.requests = record.requests.filter(timestamp => timestamp > windowStart);
      
      // Remove empty records to save memory
      if (record.requests.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }
}

/**
 * Create rate limiters for different use cases
 */
const createRateLimiter = (options) => {
  return new MemoryRateLimiter(options).middleware();
};

// Predefined rate limiters for common use cases
const rateLimiters = {
  // General API rate limiter - 100 requests per 15 minutes
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }),

  // Strict rate limiter for sensitive endpoints - 5 requests per minute
  strict: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: 'Too many requests to this sensitive endpoint, please try again after 1 minute.'
  }),

  // Authentication rate limiter - 10 requests per minute
  auth: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many authentication attempts, please try again after 1 minute.',
    skipSuccessfulRequests: false, // Count all auth attempts
    skipFailedRequests: false
  }),

  // Password reset rate limiter - 3 requests per hour
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset requests, please try again after 1 hour.'
  }),

  // Email sending rate limiter - 10 requests per hour
  email: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many email requests, please try again after 1 hour.'
  }),

  // File upload rate limiter - 20 requests per hour
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: 'Too many upload requests, please try again after 1 hour.'
  }),

  // API key rate limiter - 1000 requests per hour
  apiKey: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000,
    message: 'API key rate limit exceeded, please try again after 1 hour.',
    keyGenerator: (req) => {
      // Use API key if available, fallback to IP
      return req.headers['x-api-key'] || 
             req.query.apiKey || 
             req.ip || 
             'unknown';
    }
  }),

  // Beneficiary portal rate limiter - 50 requests per 15 minutes
  beneficiary: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: 'Too many requests to beneficiary portal, please try again after 15 minutes.'
  })
};

/**
 * Rate limiting middleware factory
 * Creates rate limiters with custom configurations
 */
const rateLimit = (options) => {
  return createRateLimiter(options);
};

/**
 * Apply rate limiting based on endpoint type
 */
const applyRateLimit = (endpointType) => {
  const limiter = rateLimiters[endpointType];
  if (!limiter) {
    console.warn(`Unknown rate limiter type: ${endpointType}. Using general rate limiter.`);
    return rateLimiters.general;
  }
  return limiter;
};

/**
 * Dynamic rate limiting based on user tier
 */
const createDynamicRateLimiter = (getUserTier) => {
  return (req, res, next) => {
    const userTier = getUserTier(req);
    
    let limits;
    switch (userTier) {
      case 'premium':
        limits = { windowMs: 15 * 60 * 1000, max: 1000 }; // 1000 requests per 15 min
        break;
      case 'pro':
        limits = { windowMs: 15 * 60 * 1000, max: 500 };  // 500 requests per 15 min
        break;
      case 'free':
        limits = { windowMs: 15 * 60 * 1000, max: 100 };   // 100 requests per 15 min
        break;
      default:
        limits = { windowMs: 15 * 60 * 1000, max: 50 };    // 50 requests per 15 min
    }
    
    const limiter = createRateLimiter({
      ...limits,
      message: `Rate limit exceeded for ${userTier || 'free'} tier. Upgrade your plan for higher limits.`
    });
    
    limiter(req, res, next);
  };
};

/**
 * Rate limiting with custom key generator (e.g., for user-based limiting)
 */
const createUserBasedRateLimiter = (getUserIdentifier) => {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return getUserIdentifier(req) || req.ip || 'anonymous';
    },
    message: 'User rate limit exceeded, please try again later.'
  });
};

/**
 * Cleanup old rate limit records periodically
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // Default window
  const windowStart = now - windowMs;
  
  let cleanedCount = 0;
  for (const [key, record] of rateLimitStore.entries()) {
    const originalLength = record.requests.length;
    record.requests = record.requests.filter(timestamp => timestamp > windowStart);
    
    if (record.requests.length === 0) {
      rateLimitStore.delete(key);
      cleanedCount++;
    } else if (record.requests.length < originalLength) {
      cleanedCount += originalLength - record.requests.length;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Rate limit cleanup: removed ${cleanedCount} expired records`);
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

// Graceful shutdown
process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
  rateLimitStore.clear();
});

process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
  rateLimitStore.clear();
});

/**
 * Get rate limit statistics (for monitoring)
 */
const getRateLimitStats = () => {
  const stats = {
    totalKeys: rateLimitStore.size,
    totalRequests: 0,
    averageRequestsPerKey: 0,
    topConsumers: []
  };
  
  const consumers = [];
  
  for (const [key, record] of rateLimitStore.entries()) {
    stats.totalRequests += record.requests.length;
    consumers.push({
      key: key.substring(0, 10) + '...', // Truncate for privacy
      requests: record.requests.length,
      totalRequests: record.totalRequests
    });
  }
  
  if (stats.totalKeys > 0) {
    stats.averageRequestsPerKey = Math.round(stats.totalRequests / stats.totalKeys);
  }
  
  // Sort by current requests and get top 10
  stats.topConsumers = consumers
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);
  
  return stats;
};

module.exports = {
  rateLimit,
  rateLimiters,
  applyRateLimit,
  createDynamicRateLimiter,
  createUserBasedRateLimiter,
  getRateLimitStats,
  MemoryRateLimiter
};
