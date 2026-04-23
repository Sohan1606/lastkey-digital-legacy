const mongoose = require('mongoose');

const beneficiaryAccessSchema = new mongoose.Schema({
  // The secure token sent in email
  token: {
    type: String,
    required: true,
    unique: true
  },

  // Who this belongs to
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // What they can access
  assignedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  }],

  // Security - Verification
  verificationQuestion: { type: String },
  verificationAnswerHash: { type: String },
  verificationAttempts: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },

  // Device tracking
  firstAccessIp: { type: String },
  firstAccessDevice: { type: String },

  // Status
  isRevoked: { type: Boolean, default: false },
  revokedAt: { type: Date },

  // Delivery confirmation
  hasBeenAccessed: { type: Boolean, default: false },
  firstAccessedAt: { type: Date },
  lastAccessedAt: { type: Date },
  accessCount: { type: Number, default: 0 },

  // Account claim
  claimedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: { type: Date },
  isClaimed: { type: Boolean, default: false },

  // Expiry
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },

  // Session management (after verification)
  sessionToken: { type: String },
  sessionExpiresAt: { type: Date },

  // Manual verification status
  manualVerificationStatus: {
    type: String,
    enum: ['none', 'requested', 'under_review', 'approved', 'rejected'],
    default: 'none'
  },

  // SECURITY LAYER 2 - Device fingerprinting (detailed)
  firstAccessDevice: {
    ip: { type: String },
    userAgent: { type: String },
    screenResolution: { type: String },
    timezone: { type: String },
    timestamp: { type: Date }
  },
  lastAccessDevice: {
    ip: { type: String },
    userAgent: { type: String },
    screenResolution: { type: String },
    timezone: { type: String },
    timestamp: { type: Date }
  },
  requiresReverification: { type: Boolean, default: false },

  accessedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

beneficiaryAccessSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
beneficiaryAccessSchema.index({ beneficiaryId: 1 });
beneficiaryAccessSchema.index({ ownerId: 1 });
beneficiaryAccessSchema.index({ sessionToken: 1 });
beneficiaryAccessSchema.index({ claimedByUserId: 1 });

module.exports = mongoose.model('BeneficiaryAccess', beneficiaryAccessSchema);
