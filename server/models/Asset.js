const mongoose = require('mongoose');

// NOTE: Server-side encryption removed (P2)
// All encryption is now client-side using WebCrypto API
// Server only stores ciphertext - never has access to plaintext passwords

const assetSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true // Encrypted
  },
  notes: {
    type: String,
    trim: true
  },
  instruction: {
    type: String,
    enum: ['delete', 'share', 'transfer'],
    required: true
  },
  // Cryptocurrency-specific fields
  assetType: {
    type: String,
    enum: ['general', 'crypto_exchange', 'crypto_wallet', 'hardware_wallet', 'seed_phrase', 'private_key'],
    default: 'general'
  },
  cryptocurrency: {
    type: String,
    enum: ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'ADA', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI', 'AAVE', 'COMP', 'MKR', 'SUSHI', 'CRV', 'YFI', 'other'],
    default: null
  },
  walletAddress: {
    type: String,
    trim: true
  },
  blockchain: {
    type: String,
    enum: ['Bitcoin', 'Ethereum', 'BSC', 'Polygon', 'Solana', 'Avalanche', 'Cardano', 'Polkadot', 'other'],
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientEncrypted: {
    type: Boolean,
    default: true // Safe default: assume encrypted unless explicitly marked otherwise
  },
  // Access control for beneficiaries
  visibleToBeneficiaries: {
    type: Boolean,
    default: true
  },
  allowedBeneficiaries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary'
  }],
  // Security metadata
  securityLevel: {
    type: String,
    enum: ['standard', 'high', 'critical'],
    default: 'standard'
  }
}, { timestamps: true });

// NOTE: Server-side encryption hooks removed (P2)
// Passwords are encrypted client-side before reaching the server
// The 'password' field stores AES-GCM ciphertext from the client's WebCrypto API

// Method to check if password is client-encrypted (for validation)
assetSchema.methods.isClientEncrypted = function() {
  return this.clientEncrypted === true;
};

module.exports = mongoose.model('Asset', assetSchema);
