const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ASSET_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.error('⚠️  ASSET_ENCRYPTION_KEY not set — vault encryption uses insecure fallback');
}

const KEY = ENCRYPTION_KEY || 'INSECURE-DEV-KEY-CHANGE-THIS-NOW-32C';

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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Encrypt password before saving
assetSchema.pre('save', function() {
  if (this.isModified('password')) {
    this.password = CryptoJS.AES.encrypt(this.password, KEY).toString();
  }
});

// Decrypt password method
assetSchema.methods.decryptPassword = function() {
  const bytes = CryptoJS.AES.decrypt(this.password, KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = mongoose.model('Asset', assetSchema);
