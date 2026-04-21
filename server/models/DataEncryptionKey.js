const mongoose = require('mongoose');

/**
 * Data Encryption Key (DEK) Model
 *
 * Stores the owner's encrypted DEK wrapper + beneficiary shares (ciphertext only).
 * Server never stores plaintext DEK.
 */

const beneficiaryShareSchema = new mongoose.Schema(
  {
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: true
    },

    // Encrypted DEK share (format depends on your client implementation)
    encryptedShare: {
      ciphertext: { type: String, required: true },
      iv: { type: String, required: true },
      encryptedKey: { type: String, required: true }, // RSA-encrypted AES key (if used)
      beneficiaryPublicKeyHash: { type: String, required: true } // for verification
    },

    grantedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    accessedAt: { type: Date, default: null },
    accessCount: { type: Number, default: 0 }
  },
  { _id: true }
);

const dekSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
      // NOTE: unique index defined below via schema.index (single source of truth)
    },

    // Master DEK (stored encrypted with owner's password-derived key)
    encryptedMasterKey: {
      ciphertext: { type: String, required: true },
      iv: { type: String, required: true },
      salt: { type: String, required: true },
      iterations: { type: Number, default: 100000 },
      version: { type: String, default: '1' }
    },

    // Password verification helper (constant-time compare)
    keyVerification: {
      hash: { type: String, required: true },
      salt: { type: String, required: true }
    },

    beneficiaryShares: [beneficiaryShareSchema],

    rotatedAt: { type: Date, default: null },
    rotationCount: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

// ------------------------
// Indexes (define ONCE here)
// ------------------------
dekSchema.index({ ownerId: 1 }, { unique: true });
dekSchema.index({ 'beneficiaryShares.beneficiaryId': 1 });

// ------------------------
// Methods
// ------------------------

/**
 * Verify if a password-derived key hash matches (constant-time compare)
 */
dekSchema.methods.verifyPassword = async function (passwordDerivedKeyHash) {
  const crypto = require('crypto');

  const storedHash = Buffer.from(this.keyVerification.hash, 'hex');
  const inputHash = Buffer.from(passwordDerivedKeyHash, 'hex');

  if (storedHash.length !== inputHash.length) return false;

  return crypto.timingSafeEqual(storedHash, inputHash);
};

/**
 * Record beneficiary access to their DEK share
 */
dekSchema.methods.recordBeneficiaryAccess = async function (beneficiaryId) {
  const share = this.beneficiaryShares.find(
    (s) => s.beneficiaryId.toString() === beneficiaryId.toString() && !s.revokedAt
  );

  if (!share) throw new Error('No valid share found for beneficiary');

  share.accessedAt = new Date();
  share.accessCount += 1;

  return this.save();
};

/**
 * Revoke a beneficiary's access to the DEK
 */
dekSchema.methods.revokeBeneficiaryAccess = async function (beneficiaryId) {
  const share = this.beneficiaryShares.find(
    (s) => s.beneficiaryId.toString() === beneficiaryId.toString()
  );

  if (share) {
    share.revokedAt = new Date();
    return this.save();
  }

  return this;
};

/**
 * Check if a beneficiary has an active share
 */
dekSchema.methods.hasActiveShare = function (beneficiaryId) {
  return this.beneficiaryShares.some(
    (s) => s.beneficiaryId.toString() === beneficiaryId.toString() && !s.revokedAt
  );
};

/**
 * Get active share for beneficiary
 */
dekSchema.methods.getActiveShare = function (beneficiaryId) {
  return this.beneficiaryShares.find(
    (s) => s.beneficiaryId.toString() === beneficiaryId.toString() && !s.revokedAt
  );
};

module.exports = mongoose.model('DataEncryptionKey', dekSchema);