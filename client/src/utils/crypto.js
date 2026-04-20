// Client-side encryption utilities using Web Crypto API
// Zero-knowledge architecture: DEK-based encryption for vault and documents

// DEK (Data Encryption Key) management
let masterDEK = null; // In-memory only, never persisted

/**
 * Set the master DEK (called after password derivation)
 * @param {CryptoKey} dek - The master data encryption key
 */
export function setMasterDEK(dek) {
  masterDEK = dek;
}

/**
 * Get the master DEK
 * @returns {CryptoKey|null}
 */
export function getMasterDEK() {
  return masterDEK;
}

/**
 * Clear the master DEK (on logout or timeout)
 */
export function clearMasterDEK() {
  masterDEK = null;
}

/**
 * Check if DEK is available
 * @returns {boolean}
 */
export function hasDEK() {
  return masterDEK !== null;
}

/**
 * Derive an AES-GCM key from a user password using PBKDF2
 * @param {string} password - The user's password
 * @param {string} salt - A unique salt (e.g., user's email)
 * @returns {Promise<CryptoKey>} - The derived encryption key
 */
export async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text using AES-GCM
 * @param {string} text - The text to encrypt
 * @param {CryptoKey} key - The encryption key from deriveKey
 * @returns {Promise<string>} - Base64 encoded encrypted data (IV + ciphertext)
 */
export async function encryptText(text, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Convert to base64 for transmission
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt text using AES-GCM
 * @param {string} b64 - Base64 encoded encrypted data (IV + ciphertext)
 * @param {CryptoKey} key - The encryption key from deriveKey
 * @returns {Promise<string>} - The decrypted text
 */
export async function decryptText(b64, key) {
  const combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Check if Web Crypto API is supported
 * @returns {boolean}
 */
export function isCryptoSupported() {
  return typeof window !== 'undefined' && 
         window.crypto && 
         window.crypto.subtle;
}

/**
 * Generate a secure random string for use as a temporary key
 * @param {number} length - Length of the string in bytes
 * @returns {string} - Base64 encoded random string
 */
export function generateRandomString(length = 32) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Generate a new master DEK (256-bit AES key)
 * @returns {Promise<CryptoKey>}
 */
export async function generateMasterDEK() {
  return window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable for encryption with password
    ['encrypt', 'decrypt']
  );
}

/**
 * Export DEK to raw bytes for encryption with password
 * @param {CryptoKey} dek
 * @returns {Promise<ArrayBuffer>}
 */
export async function exportDEK(dek) {
  return window.crypto.subtle.exportKey('raw', dek);
}

/**
 * Import DEK from raw bytes
 * @param {ArrayBuffer} rawKey
 * @returns {Promise<CryptoKey>}
 */
export async function importDEK(rawKey) {
  return window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt the master DEK with a password-derived key
 * @param {CryptoKey} dek - The master DEK
 * @param {string} password - User's password
 * @param {string} salt - Unique salt (e.g., user email)
 * @returns {Promise<{ciphertext: string, iv: string, salt: string}>}
 */
export async function encryptDEKWithPassword(dek, password, salt) {
  const derivedKey = await deriveKey(password, salt);
  const rawDEK = await exportDEK(dek);
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    rawDEK
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return {
    ciphertext: btoa(String.fromCharCode(...combined)),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...new TextEncoder().encode(salt)))
  };
}

/**
 * Decrypt the master DEK with a password-derived key
 * @param {string} ciphertext - Base64 encrypted DEK
 * @param {string} password - User's password
 * @param {string} salt - Salt used for encryption
 * @returns {Promise<CryptoKey>}
 */
export async function decryptDEKWithPassword(ciphertext, password, salt) {
  const derivedKey = await deriveKey(password, salt);
  
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    data
  );
  
  const dek = await importDEK(decrypted);
  masterDEK = dek; // Cache in memory
  return dek;
}

// RSA Keypair generation for beneficiaries

/**
 * Generate RSA keypair for beneficiary
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
 */
export async function generateRSAKeypair() {
  return window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true, // extractable for storage
    ['encrypt', 'decrypt']
  );
}

/**
 * Export RSA public key to JWK format
 * @param {CryptoKey} publicKey
 * @returns {Promise<JsonWebKey>}
 */
export async function exportRSAPublicKey(publicKey) {
  return window.crypto.subtle.exportKey('jwk', publicKey);
}

/**
 * Export RSA private key to JWK format
 * @param {CryptoKey} privateKey
 * @returns {Promise<JsonWebKey>}
 */
export async function exportRSAPrivateKey(privateKey) {
  return window.crypto.subtle.exportKey('jwk', privateKey);
}

/**
 * Import RSA public key from JWK
 * @param {JsonWebKey} jwk
 * @returns {Promise<CryptoKey>}
 */
export async function importRSAPublicKey(jwk) {
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

/**
 * Import RSA private key from JWK
 * @param {JsonWebKey} jwk
 * @returns {Promise<CryptoKey>}
 */
export async function importRSAPrivateKey(jwk) {
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
}

/**
 * Encrypt DEK for beneficiary (using their RSA public key)
 * @param {CryptoKey} dek - Master DEK
 * @param {CryptoKey} beneficiaryPublicKey - Beneficiary's RSA public key
 * @returns {Promise<string>} - Base64 encrypted DEK
 */
export async function encryptDEKForBeneficiary(dek, beneficiaryPublicKey) {
  const rawDEK = await exportDEK(dek);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    beneficiaryPublicKey,
    rawDEK
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

/**
 * Decrypt DEK as beneficiary (using their RSA private key)
 * @param {string} encryptedDEK - Base64 encrypted DEK
 * @param {CryptoKey} beneficiaryPrivateKey - Beneficiary's RSA private key
 * @returns {Promise<CryptoKey>}
 */
export async function decryptDEKAsBeneficiary(encryptedDEK, beneficiaryPrivateKey) {
  const encrypted = Uint8Array.from(atob(encryptedDEK), c => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    beneficiaryPrivateKey,
    encrypted
  );
  return importDEK(decrypted);
}

// ============================================
// Additional DEK utilities for file encryption
// ============================================

/**
 * Encrypt file data with DEK
 * @param {ArrayBuffer} fileData - Raw file bytes
 * @param {CryptoKey} dek - Data Encryption Key
 * @returns {Promise<{ciphertextB64: string, ivB64: string}>}
 */
export async function encryptFileWithDEK(fileData, dek) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    dek,
    fileData
  );
  
  return {
    ciphertextB64: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    ivB64: btoa(String.fromCharCode(...iv))
  };
}

/**
 * Decrypt file data with DEK
 * @param {string} ciphertextB64 - Base64 encrypted file
 * @param {string} ivB64 - Base64 IV
 * @param {CryptoKey} dek - Data Encryption Key
 * @returns {Promise<ArrayBuffer>}
 */
export async function decryptFileWithDEK(ciphertextB64, ivB64, dek) {
  const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  
  return window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    dek,
    ciphertext
  );
}

/**
 * Encrypt text with DEK (for vault secrets)
 * @param {string} text - Plaintext to encrypt
 * @param {CryptoKey} dek - Data Encryption Key
 * @returns {Promise<string>} - Base64 encrypted data (IV + ciphertext)
 */
export async function encryptTextWithDEK(text, dek) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    dek,
    enc.encode(text)
  );
  
  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt text with DEK (for vault secrets)
 * @param {string} ciphertextB64 - Base64 encrypted data (IV + ciphertext)
 * @param {CryptoKey} dek - Data Encryption Key
 * @returns {Promise<string>} - Decrypted plaintext
 */
export async function decryptTextWithDEK(ciphertextB64, dek) {
  const combined = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    dek,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Wrap DEK with KEK (Key Encryption Key)
 * @param {CryptoKey} dek - Data Encryption Key to wrap
 * @param {CryptoKey} kek - Key Encryption Key (derived from password)
 * @returns {Promise<{ciphertextB64: string, ivB64: string}>}
 */
export async function wrapDEKWithKEK(dek, kek) {
  const rawDEK = await exportDEK(dek);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    kek,
    rawDEK
  );
  
  return {
    ciphertextB64: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    ivB64: btoa(String.fromCharCode(...iv))
  };
}

/**
 * Unwrap DEK with KEK
 * @param {string} ciphertextB64 - Wrapped DEK
 * @param {string} ivB64 - IV for wrapping
 * @param {CryptoKey} kek - Key Encryption Key
 * @returns {Promise<CryptoKey>}
 */
export async function unwrapDEKWithKEK(ciphertextB64, ivB64, kek) {
  const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    kek,
    ciphertext
  );
  
  const dek = await importDEK(decrypted);
  masterDEK = dek; // Cache in memory
  return dek;
}

/**
 * Generate a random salt for PBKDF2
 * @param {number} length - Salt length in bytes (default 16)
 * @returns {string} - Base64 encoded salt
 */
export function generateSalt(length = 16) {
  const salt = window.crypto.getRandomValues(new Uint8Array(length));
  return btoa(String.fromCharCode(...salt));
}

/**
 * Compute SHA-256 hash of data
 * @param {ArrayBuffer} data - Data to hash
 * @returns {Promise<string>} - Hex encoded hash
 */
export async function computeSHA256(data) {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
