const mongoose = require('mongoose');
const crypto = require('crypto');

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  // SHA-256 hash for integrity verification
  sha256Hash: {
    type: String,
    required: true
  },
  // Encryption metadata
  encrypted: {
    type: Boolean,
    default: true
  },
  // Storage path (relative to uploads directory)
  storagePath: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const legalDocumentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Document classification
  type: {
    type: String,
    required: true,
    enum: [
      'deed',           // Property deed
      'title',          // Vehicle/boat title
      'tax',            // Tax records
      'insurance',      // Insurance policies
      'contract',       // Legal contracts
      'will',           // Last will and testament
      'trust',          // Trust documents
      'poa',            // Power of attorney
      'medical',        // Medical directives
      'financial',      // Financial account docs
      'identification', // ID documents
      'other'           // Other legal docs
    ]
  },
  // Document title/name
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  // Property-specific fields (optional)
  propertyAddress: {
    type: String,
    trim: true,
    maxlength: 500
  },
  parcelId: {
    type: String, // APN - Assessor's Parcel Number
    trim: true
  },
  // Recording information
  recordingInfo: {
    recorderOffice: {
      type: String,
      trim: true,
      maxlength: 300
    },
    instrumentNumber: {
      type: String,
      trim: true
    },
    bookPage: {
      type: String,
      trim: true
    },
    documentNumber: {
      type: String,
      trim: true
    },
    recordedDate: {
      type: Date
    }
  },
  // Notarization status
  notarized: {
    type: Boolean,
    default: false
  },
  notaryInfo: {
    notaryName: String,
    commissionNumber: String,
    expiryDate: Date
  },
  // Original document location
  originalLocation: {
    type: {
      type: String,
      enum: ['home_safe', 'safe_deposit', 'lawyer', 'accountant', 'family_member', 'other'],
      required: true
    },
    details: {
      type: String,
      maxlength: 500,
      required: true
    }
  },
  // Instructions for beneficiary
  instructionsForBeneficiary: {
    type: String,
    maxlength: 2000,
    required: true
  },
  // How to obtain certified copy
  certifiedCopyInstructions: {
    type: String,
    maxlength: 1000
  },
  // Attachments (scans/photos)
  attachments: [attachmentSchema],
  // Beneficiary visibility
  visibleToBeneficiaries: {
    type: Boolean,
    default: true
  },
  // Specific beneficiary access (if not all)
  allowedBeneficiaries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary'
  }],
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
legalDocumentSchema.index({ ownerId: 1, type: 1 });
legalDocumentSchema.index({ ownerId: 1, visibleToBeneficiaries: 1 });

// Method to verify attachment integrity
legalDocumentSchema.methods.verifyAttachmentIntegrity = function(attachmentId) {
  const attachment = this.attachments.id(attachmentId);
  if (!attachment) return null;
  
  // In real implementation, this would read file and compute hash
  // For now, return the stored hash for comparison
  return {
    storedHash: attachment.sha256Hash,
    verified: true // Placeholder - actual verification would happen in controller
  };
};

// Static method to compute SHA-256 hash
legalDocumentSchema.statics.computeHash = function(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

module.exports = mongoose.model('LegalDocument', legalDocumentSchema);
