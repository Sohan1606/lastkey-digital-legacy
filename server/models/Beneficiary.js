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
  // OTP for email-based login (2-step verification)
  loginOtp: {
    hash: { type: String, select: false },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 }
  },
  // Encryption keys for vault share (DEK encryption)
  encryptionKeys: {
    publicKeyJwk: { type: String }, // RSA public key for encrypting DEK share
    encryptedPrivateKeyBlob: {
      iv: { type: String },
      ciphertext: { type: String },
      kdfSalt: { type: String },
      kdfIterations: { type: Number, default: 100000 },
      algVersion: { type: String, default: '1' }
    }
  },
  // Vault share (DEK encrypted with beneficiary public key via RSA-OAEP)
  vaultShare: {
    encryptedDekB64: { type: String }, // Base64 RSA-OAEP encrypted DEK
    dekShareVersion: { type: String, default: '1' },
    dekShareCreatedAt: { type: Date },
    dekShareUpdatedAt: { type: Date }
  },
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

// Method to set login OTP
beneficiarySchema.methods.setLoginOtp = async function(otp) {
  this.loginOtp = {
    hash: await bcrypt.hash(otp, 10),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: 0
  };
};

// Method to verify login OTP
beneficiarySchema.methods.verifyLoginOtp = async function(otp) {
  if (!this.loginOtp?.hash || !this.loginOtp?.expiresAt) {
    return { valid: false, reason: 'no_otp' };
  }
  
  if (new Date() > this.loginOtp.expiresAt) {
    return { valid: false, reason: 'expired' };
  }
  
  if (this.loginOtp.attempts >= 3) {
    return { valid: false, reason: 'too_many_attempts' };
  }
  
  this.loginOtp.attempts += 1;
  
  const isValid = await bcrypt.compare(otp, this.loginOtp.hash);
  
  if (isValid) {
    // Clear OTP after successful verification
    this.loginOtp = undefined;
    return { valid: true };
  }
  
  return { valid: false, reason: 'invalid' };
};

// Method to clear expired OTP
beneficiarySchema.methods.clearExpiredOtp = function() {
  if (this.loginOtp?.expiresAt && new Date() > this.loginOtp.expiresAt) {
    this.loginOtp = undefined;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
