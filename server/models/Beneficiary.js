const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const beneficiarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email'],
    index: true
  },
  relationship: {
    type: String,
    required: true,
    enum: ['spouse', 'child', 'parent', 'sibling', 'friend', 'lawyer', 'other'],
    default: 'other'
  },
  accessLevel: {
    type: String,
    enum: ['view', 'full'],
    default: 'view'
  },
  // Enrollment status for new beneficiary portal flow
  enrollmentStatus: {
    type: String,
    enum: ['invited', 'enrolled', 'active'],
    default: 'invited'
  },
  enrolledAt: {
    type: Date
  },
  // Beneficiary unlock secret (hashed) - for decrypting vault content after trigger
  unlockSecretHash: {
    type: String,
    select: false
  },
  // WebAuthn/Passkey credentials
  webauthnCredentials: [{
    credentialId: { type: String, required: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
    deviceName: { type: String }
  }],
  // Legacy: Remove old emergency access code fields (replaced by new flow)
  // emergencyAccessCode removed - no longer used
  // emergencyAccessExpires removed - no longer used
  accessLog: [{
    accessedAt: { type: Date },
    ip: { type: String }
  }],
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
beneficiarySchema.index({ userId: 1, enrollmentStatus: 1 });
beneficiarySchema.index({ email: 1, enrollmentStatus: 1 });

// Method to set unlock secret
beneficiarySchema.methods.setUnlockSecret = async function(secret) {
  this.unlockSecretHash = await bcrypt.hash(secret, 12);
};

// Method to verify unlock secret
beneficiarySchema.methods.verifyUnlockSecret = async function(secret) {
  if (!this.unlockSecretHash) return false;
  return await bcrypt.compare(secret, this.unlockSecretHash);
};

// Method to complete enrollment
beneficiarySchema.methods.completeEnrollment = function() {
  this.enrollmentStatus = 'enrolled';
  this.enrolledAt = new Date();
};

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
