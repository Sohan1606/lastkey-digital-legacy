const mongoose = require('mongoose');
const crypto = require('crypto');

const emergencySessionSchema = new mongoose.Schema({
  grantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyAccessGrant',
    required: true
    // Indexed via schema.index() if needed
  },
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary',
    required: true
    // Compound index defined at schema level (line 65)
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // Indexed if needed for audit queries
  },
  // Session token hash (never store plain token)
  sessionTokenHash: {
    type: String,
    required: true
    // Compound index defined at schema level (line 66)
  },
  // Session expires at (30 minutes default)
  expiresAt: {
    type: Date,
    required: true
    // TTL index defined at schema level (line 67)
  },
  // Last activity timestamp
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
  // IP and user agent for audit
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  // Session status
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
    // Compound index defined at schema level (lines 65-66)
  },
  revokedAt: {
    type: Date
  },
  revokeReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
emergencySessionSchema.index({ beneficiaryId: 1, status: 1 });
emergencySessionSchema.index({ sessionTokenHash: 1, status: 1 });
emergencySessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Generate a new session token
emergencySessionSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Hash a token for storage
emergencySessionSchema.statics.hashToken = function(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Method to check if session is valid
emergencySessionSchema.methods.isValid = function() {
  if (this.status !== 'active') return false;
  if (this.expiresAt < new Date()) return false;
  return true;
};

// Method to extend session (activity-based)
emergencySessionSchema.methods.extend = function(minutes = 30) {
  this.lastSeenAt = new Date();
  this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  return this.save();
};

// Method to revoke session
emergencySessionSchema.methods.revoke = function(reason = 'User logout') {
  this.status = 'revoked';
  this.revokedAt = new Date();
  this.revokeReason = reason;
  return this.save();
};

module.exports = mongoose.model('EmergencySession', emergencySessionSchema);
