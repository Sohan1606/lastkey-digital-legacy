const mongoose = require('mongoose');

const emergencyAccessGrantSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'granted', 'denied', 'expired'],
    default: 'pending',
    index: true
  },
  waitPeriodHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 720 // 30 days max
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  grantedAt: {
    type: Date
  },
  deniedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  // Access scopes/permissions
  scopes: {
    viewAssets: {
      type: Boolean,
      default: true
    },
    viewDocuments: {
      type: Boolean,
      default: true
    },
    viewCapsules: {
      type: Boolean,
      default: true
    },
    downloadFiles: {
      type: Boolean,
      default: true
    }
  },
  // Access level: 'view' or 'full'
  accessLevel: {
    type: String,
    enum: ['view', 'full'],
    default: 'view'
  },
  // Denial reason (if denied)
  denialReason: {
    type: String
  },
  // IP and user agent for audit
  requestIp: {
    type: String
  },
  requestUserAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
emergencyAccessGrantSchema.index({ ownerId: 1, beneficiaryId: 1, status: 1 });
emergencyAccessGrantSchema.index({ status: 1, expiresAt: 1 });

// Method to check if grant is valid
emergencyAccessGrantSchema.methods.isValid = function() {
  if (this.status !== 'granted') return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

module.exports = mongoose.model('EmergencyAccessGrant', emergencyAccessGrantSchema);
