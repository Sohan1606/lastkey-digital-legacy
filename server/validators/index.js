const { z } = require('zod');

// ============================================
// Auth Validators
// ============================================

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
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
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// ============================================
// Beneficiary Validators
// ============================================

const createBeneficiarySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  relationship: z.enum(['spouse', 'child', 'parent', 'sibling', 'friend', 'other']),
  accessLevel: z.enum(['view', 'download', 'full']).default('view'),
  phone: z.string().optional(),
  message: z.string().max(1000, 'Message must be less than 1000 characters').optional()
});

const updateBeneficiarySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  relationship: z.enum(['spouse', 'child', 'parent', 'sibling', 'friend', 'other']).optional(),
  accessLevel: z.enum(['view', 'download', 'full']).optional(),
  phone: z.string().optional(),
  message: z.string().max(1000).optional()
});

// ============================================
// Asset Validators
// ============================================

const createAssetSchema = z.object({
  type: z.enum(['password', 'note', 'file', 'crypto', 'license', 'other']),
  name: z.string().min(1, 'Name is required').max(200),
  encryptedData: z.string().min(1, 'Encrypted data is required'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  beneficiaryIds: z.array(z.string()).optional()
});

const updateAssetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  encryptedData: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  beneficiaryIds: z.array(z.string()).optional()
});

// ============================================
// Capsule Validators
// ============================================

const createCapsuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  recipientEmail: z.string().email('Invalid recipient email'),
  scheduledDate: z.string().datetime(),
  beneficiaryId: z.string().optional()
});

// ============================================
// Legal Document Validators
// ============================================

const createLegalDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.enum(['deed', 'title', 'will', 'trust', 'poa', 'insurance', 'tax', 'other']),
  description: z.string().max(2000).optional(),
  recordingInfo: z.object({
    instrumentNumber: z.string().optional(),
    book: z.string().optional(),
    page: z.string().optional(),
    recordingDate: z.string().datetime().optional(),
    parcelId: z.string().optional()
  }).optional(),
  originalLocation: z.object({
    location: z.string().min(1, 'Location is required'),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
    instructions: z.string().max(1000).optional()
  }).optional(),
  beneficiaryIds: z.array(z.string()).optional()
});

// ============================================
// User Settings Validators
// ============================================

const updateSettingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  inactivityDuration: z.number().min(7).max(365).optional(),
  alertChannels: z.array(z.enum(['email', 'whatsapp', 'telegram'])).optional(),
  recoveryPassphrase: z.string().min(12, 'Recovery passphrase must be at least 12 characters').optional()
});

// ============================================
// Beneficiary Portal Validators
// ============================================

const beneficiaryCheckStatusSchema = z.object({
  email: z.string().email('Invalid email address')
});

const beneficiaryEnrollSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

const beneficiaryLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const requestAccessSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required')
});

// ============================================
// WebAuthn Validators
// ============================================

const webauthnRegisterSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional()
});

const webauthnVerifySchema = z.object({
  userId: z.string().min(1),
  response: z.object({}).passthrough(),
  challenge: z.string().min(1)
});

// ============================================
// Validation Middleware Factory
// ============================================

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      next(error);
    }
  };
};

module.exports = {
  // Schemas
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createBeneficiarySchema,
  updateBeneficiarySchema,
  createAssetSchema,
  updateAssetSchema,
  createCapsuleSchema,
  createLegalDocumentSchema,
  updateSettingsSchema,
  beneficiaryCheckStatusSchema,
  beneficiaryEnrollSchema,
  beneficiaryLoginSchema,
  requestAccessSchema,
  webauthnRegisterSchema,
  webauthnVerifySchema,
  // Middleware
  validate
};
