// Client-side encryption utilities using Web Crypto API
// This provides an additional layer of encryption before data leaves the browser

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
