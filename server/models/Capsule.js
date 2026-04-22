const mongoose = require('mongoose');

const capsuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: 100
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxLength: 5000
  },
  content: {
    type: String,
    maxLength: 10000
  },
  unlockAt: {
    type: Date,
    required: [true, 'Unlock date is required']
  },
  isReleased: {
    type: Boolean,
    default: false
  },
  releasedAt: {
    type: Date
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  // Final Message specific fields
  isFinalMessage: {
    type: Boolean,
    default: false
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'Beneficiary'
  },
  attachedAssets: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Asset'
  }],
  attachedCapsules: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Capsule'
  }],
  triggerType: {
    type: String,
    enum: ['inactivity', 'date'],
    default: 'inactivity'
  },
  // DEK encryption metadata
  encryptionMetadata: {
    dekVersion: { type: String, default: '1' },
    iv: { type: String },
    authTag: { type: String }
  },
  // Client-side encryption flag
  clientEncrypted: {
    type: Boolean,
    default: true // Safe default: assume encrypted
  },
  // Beneficiary access control
  beneficiaryAccess: {
    type: String,
    enum: ['all', 'specific', 'none'],
    default: 'all'
  },
  allowedBeneficiaries: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Beneficiary'
  }]
}, {
  timestamps: true
});

// Indexes for performance
capsuleSchema.index({ userId: 1, unlockAt: 1 });
capsuleSchema.index({ isReleased: 1, unlockAt: 1 });
capsuleSchema.index({ triggerType: 1, unlockAt: 1 });
capsuleSchema.index({ isFinalMessage: 1, recipient: 1 });

module.exports = mongoose.model('Capsule', capsuleSchema);
