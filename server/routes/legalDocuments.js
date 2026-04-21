const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const LegalDocument = require('../models/LegalDocument');
const { protect } = require('../middleware/auth');
const { log } = require('../services/auditService');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/legal-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadsDir, req.user._id.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, PNG, and TIFF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per upload
  }
});

// Get all legal documents for owner
router.get('/', protect, async (req, res) => {
  try {
    const documents = await LegalDocument.find({ ownerId: req.user._id })
      .select('-attachments.storagePath') // Don't expose storage paths
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (err) {
    console.error('Get documents error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new legal document
router.post('/', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      type,
      title,
      propertyAddress,
      parcelId,
      recordingInfo,
      notarized,
      notaryInfo,
      originalLocation,
      instructionsForBeneficiary,
      certifiedCopyInstructions,
      visibleToBeneficiaries,
      allowedBeneficiaries
    } = req.body;

    // Check if client encrypted the files
    const clientEncrypted = req.body.clientEncrypted === 'true' || req.body.clientEncrypted === true;
    const encryptionVersion = req.body.encryptionVersion || '1';

    // Process uploaded files
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileBuffer = fs.readFileSync(file.path);
        const sha256Hash = LegalDocument.computeHash(fileBuffer);
        
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          sha256Hash,
          encrypted: clientEncrypted, // Set based on client flag
          storagePath: file.path,
          uploadedAt: new Date()
        });
      }
    }

    const document = await LegalDocument.create({
      ownerId: req.user._id,
      type,
      title,
      propertyAddress,
      parcelId,
      recordingInfo: recordingInfo ? JSON.parse(recordingInfo) : undefined,
      notarized: notarized === 'true',
      notaryInfo: notaryInfo ? JSON.parse(notaryInfo) : undefined,
      originalLocation: originalLocation ? JSON.parse(originalLocation) : undefined,
      instructionsForBeneficiary,
      certifiedCopyInstructions,
      attachments,
      visibleToBeneficiaries: visibleToBeneficiaries !== 'false',
      allowedBeneficiaries: allowedBeneficiaries ? JSON.parse(allowedBeneficiaries) : []
    });

    // Log creation
    await log('legal_document_created', {
      userId: req.user._id,
      details: { 
        documentId: document._id, 
        type: document.type,
        title: document.title 
      }
    });

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (err) {
    console.error('Create document error:', err.message);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      });
    }
    
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single document
router.get('/:id', protect, async (req, res) => {
  try {
    const document = await LegalDocument.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    }).select('-attachments.storagePath');

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (err) {
    console.error('Get document error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update document
router.put('/:id', protect, async (req, res) => {
  try {
    const document = await LegalDocument.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Log update
    await log('legal_document_updated', {
      userId: req.user._id,
      details: { documentId: document._id }
    });

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (err) {
    console.error('Update document error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete document
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await LegalDocument.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete attachment files
    if (document.attachments) {
      for (const attachment of document.attachments) {
        try {
          if (fs.existsSync(attachment.storagePath)) {
            fs.unlinkSync(attachment.storagePath);
          }
        } catch (e) {
          console.error('Failed to delete file:', e.message);
        }
      }
    }

    await document.deleteOne();

    // Log deletion
    await log('legal_document_deleted', {
      userId: req.user._id,
      details: { documentId: req.params.id }
    });

    res.status(200).json({
      success: true,
      message: 'Document deleted'
    });
  } catch (err) {
    console.error('Delete document error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Download attachment (authorized endpoint)
router.get('/:id/attachments/:attachmentId', protect, async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    const document = await LegalDocument.findOne({
      _id: id,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const attachment = document.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    if (!fs.existsSync(attachment.storagePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    // Log download
    await log('legal_document_downloaded', {
      userId: req.user._id,
      details: { 
        documentId: document._id,
        attachmentId,
        filename: attachment.originalName
      }
    });

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.sendFile(attachment.storagePath);
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
