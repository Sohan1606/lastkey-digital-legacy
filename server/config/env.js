/**
 * Environment Configuration & Validation
 * 
 * Validates all required environment variables at boot time.
 * Fails fast if critical configuration is missing.
 */

const { z } = require('zod');

// Define environment schema
const envSchema = z.object({
  // Required in all environments
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  
  // Required in production
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  
  // Optional with defaults
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  API_BASE_URL: z.string().default('http://localhost:5000'),
  
  // FREE_MODE: College project mode - no paid services required
  FREE_MODE: z.enum(['true', 'false']).default('true'),
  EMAIL_MODE: z.enum(['smtp', 'console', '']).default('console'),
  
  // Feature flags
  FEATURE_AI: z.enum(['true', 'false']).default('false'),
  FEATURE_PAYMENTS: z.enum(['true', 'false']).default('false'),
  
  // Email configuration (optional in FREE_MODE)
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().default('587'),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Legacy encryption key (for migration only)
  LEGACY_ENCRYPTION_KEY: z.string().optional(),
  
  // WebAuthn
  WEBAUTHN_RP_ID: z.string().default('localhost'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX: z.string().default('100'),
  
  // File upload
  MAX_FILE_SIZE: z.string().default('10485760'), // 10MB
  UPLOAD_DIR: z.string().default('uploads')
});

/**
 * Validate environment variables
 * @returns {Object} Validated environment config
 * @throws {Error} If validation fails
 */
const validateEnv = () => {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional production checks
    if (env.NODE_ENV === 'production') {
      const requiredInProd = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
      const missing = requiredInProd.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        console.warn(`⚠️  Warning: Missing email configuration in production: ${missing.join(', ')}`);
      }
      
      // Warn about default JWT secret
      if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
        throw new Error('❌ CRITICAL: Using default JWT_SECRET in production is not allowed!');
      }
    }
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Environment validation failed:', error.message);
    }
    process.exit(1);
  }
};

/**
 * Get sanitized environment for logging (no secrets)
 * @returns {Object} Sanitized environment
 */
const getSanitizedEnv = () => {
  const sensitiveKeys = [
    'JWT_SECRET',
    'MONGO_URI',
    'EMAIL_PASS',
    'EMAIL_USER',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'LEGACY_ENCRYPTION_KEY',
    'OPENAI_API_KEY',
    'WHATSAPP_API_KEY',
    'TELEGRAM_BOT_TOKEN',
    'WEBAUTHN_RP_ID'
  ];
  
  // Only return keys defined in envSchema (avoid leaking Windows env vars)
  const schemaKeys = [
    'NODE_ENV', 'PORT', 'JWT_SECRET', 'MONGO_URI',
    'FRONTEND_URL', 'API_BASE_URL',
    'FREE_MODE', 'EMAIL_MODE',
    'FEATURE_AI', 'FEATURE_PAYMENTS',
    'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM',
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
    'LEGACY_ENCRYPTION_KEY',
    'WEBAUTHN_RP_ID',
    'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX',
    'MAX_FILE_SIZE', 'UPLOAD_DIR'
  ];
  
  return Object.keys(process.env).reduce((acc, key) => {
    if (!schemaKeys.includes(key)) return acc; // Skip non-schema keys
    if (key.startsWith('npm_')) return acc;
    
    acc[key] = sensitiveKeys.includes(key) ? '[REDACTED]' : process.env[key];
    return acc;
  }, {});
};

module.exports = {
  validateEnv,
  getSanitizedEnv,
  env: validateEnv()
};
