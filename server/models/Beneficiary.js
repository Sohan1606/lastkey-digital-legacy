const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const beneficiarySchema = new mongoose.Schema(
  {
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

    // Verification question for portal access (SECURITY LAYER 1)
    verificationQuestion: {
      type: String,
      default: null
    },
    verificationAnswerHash: {
      type: String,
      select: false, // Never return hash by default
      default: null
    },
    verificationHint: {
      type: String,
      default: ''
    },

    // Match your owner-side validator options
    accessLevel: {
      type: String,
      enum: ['view', 'download', 'full', 'custom'],
      default: 'view'
    },

    // Vault items assigned to this beneficiary (for custom access)
    assignedVaultItems: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Asset'
    }],

    // Access options for view/download levels
    accessOptions: {
      vaultItems: { type: Boolean, default: true },
      finalMessage: { type: Boolean, default: true },
      voiceMessages: { type: Boolean, default: true },
      documents: { type: Boolean, default: true },
      memoir: { type: Boolean, default: true }
    },

    // Beneficiary Portal onboarding status
    enrollmentStatus: {
      type: String,
      enum: ['invited', 'enrolled'],
      default: 'invited'
    },
    enrolledAt: { type: Date },

    // Unlock secret hash (never return by default)
    unlockSecretHash: {
      type: String,
      select: false
    },

    // Passkey credentials (optional)
    webauthnCredentials: [
      {
        credentialId: { type: String, required: true },
        publicKey: { type: String, required: true },
        counter: { type: Number, default: 0 },
        deviceName: { type: String }
      }
    ],

    // OTP for email login (hash hidden by default)
    loginOtp: {
      hash: { type: String, select: false },
      expiresAt: { type: Date },
      attempts: { type: Number, default: 0 }
    },

    /**
     * Encryption keys for vault share (DEK share)
     * IMPORTANT: store as Mixed so client can evolve blob formats without breaking schema.
     */
    encryptionKeys: {
      publicKeyJwk: { type: mongoose.Schema.Types.Mixed }, // JWK object
      encryptedPrivateKeyBlob: { type: mongoose.Schema.Types.Mixed } // blob object
    },

    // Vault share (DEK encrypted for this beneficiary)
    vaultShare: {
      encryptedDekB64: { type: String }, // RSA-OAEP encrypted DEK
      dekShareVersion: { type: String, default: '1' },
      dekShareCreatedAt: { type: Date },
      dekShareUpdatedAt: { type: Date }
    },

    accessLog: [
      {
        accessedAt: { type: Date },
        ip: { type: String }
      }
    ],

    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// Indexes
beneficiarySchema.index({ userId: 1, enrollmentStatus: 1 });
beneficiarySchema.index({ email: 1, enrollmentStatus: 1 });

// Set unlock secret hash
beneficiarySchema.methods.setUnlockSecret = async function (secret) {
  this.unlockSecretHash = await bcrypt.hash(secret, 12);
};

// Verify unlock secret
beneficiarySchema.methods.verifyUnlockSecret = async function (secret) {
  if (!this.unlockSecretHash) return false;
  return bcrypt.compare(secret, this.unlockSecretHash);
};

// Complete enrollment
beneficiarySchema.methods.completeEnrollment = function () {
  this.enrollmentStatus = 'enrolled';
  this.enrolledAt = new Date();
};

// Set OTP
beneficiarySchema.methods.setLoginOtp = async function (otp) {
  this.loginOtp = {
    hash: await bcrypt.hash(otp, 10),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0
  };
};

// Verify OTP
beneficiarySchema.methods.verifyLoginOtp = async function (otp) {
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
    this.loginOtp = undefined;
    return { valid: true };
  }

  return { valid: false, reason: 'invalid' };
};

// Set verification answer (SECURITY LAYER 1)
beneficiarySchema.methods.setVerificationAnswer = async function (answer) {
  this.verificationAnswerHash = await bcrypt.hash(answer.toLowerCase().trim(), 12);
};

// Verify verification answer (SECURITY LAYER 1)
beneficiarySchema.methods.verifyVerificationAnswer = async function (answer) {
  if (!this.verificationAnswerHash) return false;
  return bcrypt.compare(answer.toLowerCase().trim(), this.verificationAnswerHash);
};

module.exports = mongoose.model('Beneficiary', beneficiarySchema);