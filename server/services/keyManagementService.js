const crypto = require('crypto');
const DataEncryptionKey = require('../models/DataEncryptionKey');
const Beneficiary = require('../models/Beneficiary');
const auditService = require('./auditService');

/**
 * Key Management Service
 * 
 * Handles DEK (Data Encryption Key) lifecycle:
 * - Generation of master DEKs
 * - Password-based encryption/decryption
 * - Beneficiary share creation and management
 * - RSA keypair operations for beneficiaries
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 100000;
const RSA_KEY_SIZE = 2048;

/**
 * Generate a new random master DEK
 */
exports.generateMasterDEK = () => {
  return crypto.randomBytes(KEY_LENGTH);
};

/**
 * Derive encryption key from password using PBKDF2
 */
exports.deriveKeyFromPassword = (password, salt, iterations = ITERATIONS) => {
  return crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, 'sha256');
};

/**
 * Generate RSA keypair for beneficiary
 * Returns JWK-formatted keys for client-side storage
 */
exports.generateRSAKeypair = async () => {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair('rsa', {
      modulusLength: RSA_KEY_SIZE,
      publicKeyEncoding: { type: 'spki', format: 'jwk' },
      privateKeyEncoding: { type: 'pkcs8', format: 'jwk' }
    }, (err, publicKey, privateKey) => {
      if (err) reject(err);
      else resolve({ publicKey, privateKey });
    });
  });
};

/**
 * Hash a public key for verification purposes
 */
exports.hashPublicKey = (publicKeyJwk) => {
  const publicKeyString = JSON.stringify(publicKeyJwk);
  return crypto.createHash('sha256').update(publicKeyString).digest('hex');
};

/**
 * Encrypt master DEK with password-derived key
 */
exports.encryptMasterDEK = (masterDEK, password) => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const derivedKey = exports.deriveKeyFromPassword(password, salt, ITERATIONS);
  
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(masterDEK), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Combine encrypted data with auth tag
  const ciphertext = Buffer.concat([encrypted, authTag]).toString('base64');
  
  // Create verification hash
  const verificationSalt = crypto.randomBytes(SALT_LENGTH);
  const verificationHash = crypto.pbkdf2Sync(
    masterDEK, 
    verificationSalt, 
    ITERATIONS, 
    KEY_LENGTH, 
    'sha256'
  ).toString('hex');
  
  return {
    encryptedMasterKey: {
      ciphertext,
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      iterations: ITERATIONS,
      version: '1'
    },
    keyVerification: {
      hash: verificationHash,
      salt: verificationSalt.toString('base64')
    }
  };
};

/**
 * Decrypt master DEK with password
 */
exports.decryptMasterDEK = (encryptedData, password) => {
  const { ciphertext, iv, salt, iterations } = encryptedData.encryptedMasterKey;
  
  const derivedKey = exports.deriveKeyFromPassword(
    password, 
    Buffer.from(salt, 'base64'), 
    iterations
  );
  
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
  const encrypted = ciphertextBuffer.slice(0, -AUTH_TAG_LENGTH);
  const authTag = ciphertextBuffer.slice(-AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    derivedKey, 
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted;
};

/**
 * Create DEK share for a beneficiary
 * Encrypts the master DEK with beneficiary's RSA public key
 */
exports.createBeneficiaryShare = async (masterDEK, beneficiaryPublicKeyJwk) => {
  // Generate ephemeral AES key for this share
  const ephemeralKey = crypto.randomBytes(KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Encrypt master DEK with ephemeral key
  const cipher = crypto.createCipheriv(ALGORITHM, ephemeralKey, iv);
  const encryptedDEK = Buffer.concat([cipher.update(masterDEK), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Import beneficiary's RSA public key
  const publicKeyPem = await jwkToPem(beneficiaryPublicKeyJwk, 'public');
  
  // Encrypt ephemeral key with RSA public key
  const encryptedEphemeralKey = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    ephemeralKey
  );
  
  return {
    ciphertext: Buffer.concat([encryptedDEK, authTag]).toString('base64'),
    iv: iv.toString('base64'),
    encryptedKey: encryptedEphemeralKey.toString('base64'),
    beneficiaryPublicKeyHash: exports.hashPublicKey(beneficiaryPublicKeyJwk)
  };
};

/**
 * Decrypt DEK share using beneficiary's RSA private key
 */
exports.decryptBeneficiaryShare = async (share, beneficiaryPrivateKeyJwk) => {
  // Import beneficiary's RSA private key
  const privateKeyPem = await jwkToPem(beneficiaryPrivateKeyJwk, 'private');
  
  // Decrypt ephemeral key
  const encryptedEphemeralKey = Buffer.from(share.encryptedKey, 'base64');
  const ephemeralKey = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    encryptedEphemeralKey
  );
  
  // Decrypt DEK
  const ciphertextBuffer = Buffer.from(share.ciphertext, 'base64');
  const encrypted = ciphertextBuffer.slice(0, -AUTH_TAG_LENGTH);
  const authTag = ciphertextBuffer.slice(-AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ephemeralKey,
    Buffer.from(share.iv, 'base64')
  );
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

/**
 * Initialize DEK for a new user
 */
exports.initializeUserDEK = async (userId, password) => {
  const masterDEK = exports.generateMasterDEK();
  const encryptedData = exports.encryptMasterDEK(masterDEK, password);
  
  const dek = new DataEncryptionKey({
    ownerId: userId,
    ...encryptedData,
    beneficiaryShares: []
  });
  
  await dek.save();
  
  // Audit log
  await auditService.log({
    userId,
    event: 'dek_initialized',
    details: { keyVersion: '1' }
  });
  
  return dek;
};

/**
 * Add beneficiary share to DEK
 */
exports.addBeneficiaryShare = async (ownerId, beneficiaryId, beneficiaryPublicKeyJwk) => {
  const dek = await DataEncryptionKey.findOne({ ownerId });
  if (!dek) {
    throw new Error('DEK not found for user');
  }
  
  // Check if share already exists
  if (dek.hasActiveShare(beneficiaryId)) {
    throw new Error('Beneficiary already has an active share');
  }
  
  // Decrypt master DEK (requires owner's password - this should be done client-side)
  // For server-side, we'll need the decrypted DEK passed in
  throw new Error('Client-side decryption required for adding beneficiary shares');
};

/**
 * Rotate DEK (re-encrypt with new password)
 */
exports.rotateDEK = async (ownerId, oldPassword, newPassword) => {
  const dek = await DataEncryptionKey.findOne({ ownerId });
  if (!dek) {
    throw new Error('DEK not found');
  }
  
  // Decrypt with old password
  const masterDEK = exports.decryptMasterDEK(dek.encryptedMasterKey, oldPassword);
  
  // Re-encrypt with new password
  const newEncryptedData = exports.encryptMasterDEK(masterDEK, newPassword);
  
  // Update DEK
  dek.encryptedMasterKey = newEncryptedData.encryptedMasterKey;
  dek.keyVerification = newEncryptedData.keyVerification;
  dek.rotatedAt = new Date();
  dek.rotationCount += 1;
  
  await dek.save();
  
  // Audit log
  await auditService.log({
    userId: ownerId,
    event: 'dek_rotated',
    details: { rotationCount: dek.rotationCount }
  });
  
  return dek;
};

/**
 * Helper: Convert JWK to PEM format
 */
async function jwkToPem(jwk, type) {
  if (type === 'public') {
    // Convert JWK to SPKI PEM
    const { createPublicKey } = require('crypto');
    const keyObject = createPublicKey({ key: jwk, format: 'jwk' });
    return keyObject.export({ type: 'spki', format: 'pem' });
  } else {
    // Convert JWK to PKCS8 PEM
    const { createPrivateKey } = require('crypto');
    const keyObject = createPrivateKey({ key: jwk, format: 'jwk' });
    return keyObject.export({ type: 'pkcs8', format: 'pem' });
  }
}

module.exports = exports;
