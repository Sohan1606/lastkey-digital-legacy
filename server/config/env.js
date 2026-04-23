/**
 * Environment Configuration & Validation
 *
 * Validates required environment variables at boot time.
 * Fails fast if critical configuration is missing.
 * Logs a sanitized, minimal config summary (no secrets).
 */

const { z } = require('zod');

// Define environment schema (only keys we care about)
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),

  // Required
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  FRONTEND_URL: z.string().default('http://localhost:5173'),
  API_BASE_URL: z.string().default('http://localhost:5000'),

  // College/free mode
  FREE_MODE: z.enum(['true', 'false']).default('true'),
  EMAIL_MODE: z.enum(['smtp', 'console']).default('console'),

  // Feature flags
  FEATURE_AI: z.enum(['true', 'false']).default('false'),
  FEATURE_PAYMENTS: z.enum(['true', 'false']).default('false'),

  // Optional AI key (only needed if FEATURE_AI=true and you actually call OpenAI)
  OPENAI_API_KEY: z.string().optional(),

  // Email config (optional in FREE_MODE / console mode)
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().default('587'),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Legacy migration key (optional)
  LEGACY_ENCRYPTION_KEY: z.string().optional(),

  // WebAuthn
  WEBAUTHN_RP_ID: z.string().default('localhost'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX: z.string().default('100'),

  // File upload
  MAX_FILE_SIZE: z.string().default('10485760'),
  UPLOAD_DIR: z.string().default('uploads')
});

/**
 * Validate env vars (fail fast)
 */
const validateEnv = () => {
  try {
    const env = envSchema.parse(process.env);

    // Extra production checks (keep warnings professional)
    if (env.NODE_ENV === 'production') {
      // If you choose smtp in production, enforce SMTP config presence
      if (env.EMAIL_MODE === 'smtp') {
        const required = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
        const missing = required.filter((k) => !process.env[k]);
        if (missing.length > 0) {
          console.warn(`⚠️ Missing SMTP configuration keys: ${missing.join(', ')}`);
        }
      }

      // Disallow a known default secret if someone copy-pastes it
      if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
        throw new Error('❌ CRITICAL: Using default JWT_SECRET in production is not allowed.');
      }
    }

    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:')
    
    if (error.errors && Array.isArray(error.errors)) {
      console.error(JSON.stringify(error.errors, null, 2))
    } else if (error.message) {
      console.error(' ', error.message)
    } else {
      console.error(' ', String(error))
    }
    
    console.error('\nPlease check your server/.env file.')
    console.error('Copy server/.env.example and fill in values.\n')
    process.exit(1)
  }
};

/**
 * Redact secrets (explicit list + pattern)
 */
function redactValue(key, value) {
  if (value === undefined) return undefined;

  const explicitSensitive = new Set([
    'JWT_SECRET',
    'MONGO_URI',
    'EMAIL_PASS',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'LEGACY_ENCRYPTION_KEY',
    'OPENAI_API_KEY'
  ]);

  // Pattern-based redaction as a safety net
  const patternSensitive = /(KEY|SECRET|TOKEN|PASS|PASSWORD)/i;

  if (explicitSensitive.has(key) || patternSensitive.test(key)) return '[REDACTED]';

  return value;
}

/**
 * Get sanitized environment for logging (only schema keys, no secrets)
 */
const getSanitizedEnv = () => {
  // Use validated env keys only (never dump full process.env)
  const env = module.exports.env || validateEnv();

  const out = {};
  for (const key of Object.keys(envSchema.shape)) {
    // Do not log undefined optional keys at all (keeps logs clean)
    if (env[key] === undefined) continue;
    out[key] = redactValue(key, env[key]);
  }

  return out;
};

module.exports = {
  validateEnv,
  getSanitizedEnv,
  env: validateEnv()
};