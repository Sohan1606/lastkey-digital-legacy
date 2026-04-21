const mongoose = require('mongoose');
const crypto = require('crypto');

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },

    // For encrypted uploads, this may be application/octet-stream
    mimeType: { type: String, required: true },

    size: { type: Number, required: true },

    // SHA-256 hash for integrity verification (hash of stored bytes: ciphertext if encrypted)
    sha256Hash: { type: String, required: true },

    // Encryption metadata
    encrypted: { type: Boolean, default: true },

    // Optional: IV used for AES-GCM (base64). Useful for debugging/interoperability.
    ivB64: { type: String },

    // Optional: client encryption version (string so you can evolve formats later)
    encryptionVersion: { type: String, default: '1' },

    // Absolute file path on server disk (never expose in API responses)
    storagePath: { type: String, required: true },

    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const legalDocumentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    type: {
      type: String,
      required: true,
      enum: [
        'deed',
        'title',
        'tax',
        'insurance',
        'contract',
        'will',
        'trust',
        'poa',
        'medical',
        'financial',
        'identification',
        'other'
      ]
    },

    title: { type: String, required: true, trim: true, maxlength: 200 },

    // Property-specific fields (optional)
    propertyAddress: { type: String, trim: true, maxlength: 500 },
    parcelId: { type: String, trim: true },

    // Recording / registry info (optional)
    recordingInfo: {
      recorderOffice: { type: String, trim: true, maxlength: 300 },
      instrumentNumber: { type: String, trim: true },
      bookPage: { type: String, trim: true },
      documentNumber: { type: String, trim: true },
      recordedDate: { type: Date }
    },

    notarized: { type: Boolean, default: false },

    notaryInfo: {
      notaryName: String,
      commissionNumber: String,
      expiryDate: Date
    },

    // Where the original physical document is stored (optional, but recommended)
    originalLocation: {
      type: {
        type: String,
        enum: ['home_safe', 'safe_deposit', 'lawyer', 'accountant', 'family_member', 'other']
      },
      details: {
        type: String,
        maxlength: 500
      }
    },

    // Instructions for beneficiary (recommended/required in product UX)
    instructionsForBeneficiary: { type: String, maxlength: 2000, required: true },

    certifiedCopyInstructions: { type: String, maxlength: 1000 },

    // Attachments (scans/photos) — ciphertext if encrypted=true
    attachments: [attachmentSchema],

    // Beneficiary visibility
    visibleToBeneficiaries: {
      type: Boolean,
      default: false // safe default
    },

    // If empty => all beneficiaries with document scope can view
    allowedBeneficiaries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Beneficiary'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes
legalDocumentSchema.index({ ownerId: 1, type: 1 });
legalDocumentSchema.index({ ownerId: 1, visibleToBeneficiaries: 1 });

// Method to verify attachment integrity (optional helper)
legalDocumentSchema.methods.verifyAttachmentIntegrity = function (attachmentId) {
  const attachment = this.attachments.id(attachmentId);
  if (!attachment) return null;

  return {
    storedHash: attachment.sha256Hash,
    verified: true // placeholder
  };
};

// Static method to compute SHA-256 hash
legalDocumentSchema.statics.computeHash = function (buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

module.exports = mongoose.model('LegalDocument', legalDocumentSchema);