const { z } = require('zod');

// Validation middleware factory
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({
        status: 'fail',
        message: 'Validation error',
        errors
      });
    }
    // For non-Zod errors, return 500 directly
    console.error('Validation middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Auth schemas
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128)
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128)
});

// Asset schemas
const createAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required').max(200),
  type: z.string().min(1, 'Asset type is required'),
  value: z.string().optional(),
  notes: z.string().optional(),
  beneficiary: z.string().optional()
});

const updateAssetSchema = createAssetSchema.partial();

// Beneficiary schemas
const createBeneficiarySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  relationship: z.string().min(1, 'Relationship is required'),
  accessLevel: z.enum(['view', 'download', 'full']).optional()
});

const updateBeneficiarySchema = createBeneficiarySchema.partial();

// Capsule schemas
const createCapsuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  content: z.string().min(1, 'Content is required'),
  scheduledFor: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
  type: z.enum(['message', 'video', 'document', 'audio']).optional()
});

// User settings schema
const updateSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.boolean().optional()
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createAssetSchema,
  updateAssetSchema,
  createBeneficiarySchema,
  updateBeneficiarySchema,
  createCapsuleSchema,
  updateSettingsSchema
};
