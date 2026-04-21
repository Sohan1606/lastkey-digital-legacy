const mongoose = require('mongoose');

/**
 * Data Encryption Key (DEK) Model
 * 
 * Implements a zero-knowledge encryption architecture where:
 * 1. Each user has a master DEK for encrypting their vault contents
 * 2. The DEK is encrypted with the user's password-derived key
 * 3. Beneficiaries receive encrypted "shares" of the DEK wrapped with their public keys
 * 4. Upon trigger activation, beneficiaries can decrypt their share using their private key
 * 
 * This ensures server never has access to plaintext DEK or user data
 */

const beneficiaryShareSchema = new mongoose.Schema({
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary',
    required: true
    // Index defined at schema level (line 75)
  },
  // Encrypted DEK share (encrypted with beneficiary's RSA public key)
  encryptedShare: {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    encryptedKey: { type: String, required: true }, // RSA-encrypted AES key
    beneficiaryPublicKeyHash: { type: String, required: true } // For verification
  },
  // Access control
  grantedAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null },
  accessedAt: { type: Date, default: null },
  accessCount: { type: Number, default: 0 }
}, { _id: true });

const dekSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
    // Index defined at schema level (line 74)
  },
  
  // Master DEK (256-bit AES key) - stored encrypted
  // The actual DEK is encrypted with the owner's password-derived key
  encryptedMasterKey: {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    salt: { type: String, required: true },
    iterations: { type: Number, default: 100000 },
    version: { type: String, default: '1' }
  },
  
  // Key verification - allows checking password without full decryption
  keyVerification: {
    hash: { type: String, required: true },
    salt: { type: String, required: true }
  },
  
  // Beneficiary shares (encrypted DEK portions for each beneficiary)
  beneficiaryShares: [beneficiaryShareSchema],
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  rotatedAt: { type: Date, default: null },
  rotationCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
// Note: ownerId already has unique index from field definition (line 41)
dekSchema.index({ 'beneficiaryShares.beneficiaryId': 1 });

/**
 * Verify if a password can decrypt this DEK
 * Uses constant-time comparison to prevent timing attacks
 */
dekSchema.methods.verifyPassword = async function(passwordDerivedKeyHash) {
  const crypto = require('crypto');
  const storedHash = Buffer.from(this.keyVerification.hash, 'hex');
  const inputHash = Buffer.from(passwordDerivedKeyHash, 'hex');
  
  if (storedHash.length !== inputHash.length) {
    return false;
  }
  
  // Constant-time comparison
  return crypto.timingSafeEqual(storedHash, inputHash);
};

/**
 * Record beneficiary access to their DEK share
 */
dekSchema.methods.recordBeneficiaryAccess = async function(beneficiaryId) {
  const share = this.beneficiaryShares.find(
    s => s.beneficiaryId.toString() === beneficiaryId.toString() && !s.revokedAt
  );
  
  if (!share) {
    throw new Error('No valid share found for beneficiary');
  }
  
  share.accessedAt = new Date();
  share.accessCount += 1;
  
  return this.save();
};

/**
 * Revoke a beneficiary's access to the DEK
 */
dekSchema.methods.revokeBeneficiaryAccess = async function(beneficiaryId) {
  const share = this.beneficiaryShares.find(
    s => s.beneficiaryId.toString() === beneficiaryId.toString()
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
dekSchema.methods.hasActiveShare = function(beneficiaryId) {
  return this.beneficiaryShares.some(
    s => s.beneficiaryId.toString() === beneficiaryId.toString() && 
         !s.revokedAt
  );
};

/**
 * Get active share for beneficiary
 */
dekSchema.methods.getActiveShare = function(beneficiaryId) {
  return this.beneficiaryShares.find(
    s => s.beneficiaryId.toString() === beneficiaryId.toString() && 
         !s.revokedAt
  );
};

module.exports = mongoose.model('DataEncryptionKey', dekSchema);
