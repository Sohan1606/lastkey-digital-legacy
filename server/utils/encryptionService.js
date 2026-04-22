const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    this.saltLength = 32; // 256 bits
  }

  /**
   * Generate a random salt for key derivation
   */
  generateSalt() {
    return crypto.randomBytes(this.saltLength);
  }

  /**
   * Derive encryption key from password and salt using PBKDF2
   */
  deriveKey(password, salt, iterations = 100000) {
    return crypto.pbkdf2Sync(password, salt, iterations, this.keyLength, 'sha256');
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  encrypt(plaintext, key) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipherGCM(this.algorithm, key, iv);
    cipher.setAAD(Buffer.from('lastkey-vault', 'utf8'));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: this.algorithm
    };
  }

  /**
   * Decrypt data with AES-256-GCM
   */
  decrypt(encryptedData, key) {
    const { encrypted, iv, tag } = encryptedData;
    
    const decipher = crypto.createDecipherGCM(this.algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from('lastkey-vault', 'utf8'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Wrap a data encryption key (DEK) with a key encryption key (KEK)
   */
  wrapKey(dek, kek) {
    const salt = this.generateSalt();
    const derivedKey = this.deriveKey(kek, salt);
    const wrapped = this.encrypt(dek, derivedKey);
    
    return {
      saltB64: salt.toString('base64'),
      iterations: 100000,
      ivB64: wrapped.iv,
      ciphertextB64: wrapped.encrypted,
      tagB64: wrapped.tag,
      version: '1'
    };
  }

  /**
   * Unwrap a data encryption key (DEK) with a key encryption key (KEK)
   */
  unwrapKey(wrappedDek, kek) {
    const { saltB64, iterations, ivB64, ciphertextB64, tagB64 } = wrappedDek;
    
    const salt = Buffer.from(saltB64, 'base64');
    const derivedKey = this.deriveKey(kek, salt, iterations);
    
    return this.decrypt({
      encrypted: ciphertextB64,
      iv: ivB64,
      tag: tagB64
    }, derivedKey);
  }

  /**
   * Generate a new data encryption key
   */
  generateDEK() {
    return crypto.randomBytes(this.keyLength).toString('base64');
  }

  /**
   * Encrypt vault data with a DEK
   */
  encryptVaultData(data, dek) {
    const key = Buffer.from(dek, 'base64');
    const jsonString = JSON.stringify(data);
    return this.encrypt(jsonString, key);
  }

  /**
   * Decrypt vault data with a DEK
   */
  decryptVaultData(encryptedData, dek) {
    const key = Buffer.from(dek, 'base64');
    const decryptedJson = this.decrypt(encryptedData, key);
    return JSON.parse(decryptedJson);
  }

  /**
   * Hash sensitive data for verification
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity
   */
  verifyHash(data, expectedHash) {
    const actualHash = this.hash(data);
    return actualHash === expectedHash;
  }
}

module.exports = new EncryptionService();
