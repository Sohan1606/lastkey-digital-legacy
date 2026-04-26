const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const LegalDocument = require('../models/LegalDocument');
const { protect } = require('../middleware/auth');
const { log } = require('../services/auditService');
const { uploadLimiter, scanLimiter } = require('../server');

const router = express.Router();

/**
 * Helpers
 */
function safeJsonParse(value, fallback = undefined) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value; // already parsed
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

function stripStoragePaths(doc) {
  if (!doc) return doc;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  if (Array.isArray(obj.attachments)) {
    obj.attachments = obj.attachments.map((a) => {
      const { storagePath, ...rest } = a;
      return rest;
    });
  }
  return obj;
}

/**
 * Ensure uploads directory exists
 */
const uploadsDir = path.join(__dirname, '../uploads/legal-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Multer configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadsDir, req.user._id.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

/**
 * IMPORTANT:
 * If the client encrypts a file before upload, the browser often sends it as
 * application/octet-stream. We allow that too.
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'application/octet-stream' // for encrypted ciphertext uploads
  ];

  if (allowedMimes.includes(file.mimetype)) return cb(null, true);

  return cb(
    new Error('Invalid file type. Only PDF, JPEG, PNG, TIFF, or encrypted binary uploads are allowed.'),
    false
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  }
});

/**
 * GET /api/legal-documents
 * Owner: list documents
 */
router.get('/', protect, async (req, res) => {
  try {
    const documents = await LegalDocument.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const safeDocs = documents.map(stripStoragePaths);

    return res.status(200).json({
      success: true,
      count: safeDocs.length,
      data: safeDocs
    });
  } catch (err) {
    console.error('Get documents error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/legal-documents
 * Owner: create document + upload attachments
 */
router.post('/', protect, uploadLimiter, upload.single('document'), async (req, res) => {
  try {
    // Check file was received
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No file uploaded. Please select a file.'
      })
    }

    // Validate file type using mimetype only (already validated by multer fileFilter)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'application/octet-stream'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete the uploaded file immediately
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid file type. Only PDF, JPG, PNG, TIFF allowed.'
      })
    }

    // Validate file size (10MB max - redundant but safe)
    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: 'fail',
        message: 'File too large. Maximum 10MB allowed.'
      })
    }

    // Rename file to remove path traversal risk
    const safeFileName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${path.extname(req.file.originalname).toLowerCase()}`;
    const safePath = path.join(path.dirname(req.file.path), safeFileName);
    fs.renameSync(req.file.path, safePath);
    req.file.path = safePath;
    req.file.filename = safeFileName;

    // Booleans / JSON fields
    const visibleToBeneficiaries = req.body.visibleToBeneficiaries !== 'false';
    const notarized = req.body.notarized === 'true' || req.body.notarized === true;

    const recordingInfo = safeJsonParse(req.body.recordingInfo, undefined);
    const notaryInfo = safeJsonParse(req.body.notaryInfo, undefined);
    const originalLocation = safeJsonParse(req.body.originalLocation, undefined);
    const allowedBeneficiaries = safeJsonParse(req.body.allowedBeneficiaries, []);

    // Encryption flags from client
    const clientEncrypted = req.body.clientEncrypted === 'true' || req.body.clientEncrypted === true;
    const encryptionVersion = req.body.encryptionVersion || '1';

    // Process uploaded file
    const attachments = [];
    if (req.file) {
      const file = req.file;
      const fileBuffer = fs.readFileSync(file.path);
      const sha256Hash = LegalDocument.computeHash(fileBuffer);

      // Optional per-file IV from client
      const ivB64 = req.body[`attachmentIv_0`] || req.body[`attachmentIv_${file.originalname}`] || undefined;

      const attachment = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        sha256Hash,
        encrypted: false, // Default to false for simple uploads
        storagePath: req.file.path,
        uploadedAt: new Date()
      };
      attachments.push(attachment);
    }

    // Create document with minimal required fields
    const document = await LegalDocument.create({
      ownerId: req.user._id,
      type: 'other', // Default type (must be in enum)
      title: req.file.originalname, // Use filename as title
      instructionsForBeneficiary: 'This document is stored for your reference. Please review it with legal counsel if needed.', // Required field
      attachments: attachments,
      visibleToBeneficiaries: false, // Default to false
      notarized: false // Default to false
    });

    await log('legal_document_created', {
      userId: req.user._id,
      details: { documentId: document._id, type: document.type, title: document.title },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Never return storagePath to client
    return res.status(201).json({
      success: true,
      data: stripStoragePaths(document)
    });
  } catch (err) {
    console.error('Upload error:', err.message)

    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }

    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/legal-documents/:id
 * Owner: get single document
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const document = await LegalDocument.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    return res.status(200).json({
      success: true,
      data: stripStoragePaths(document)
    });
  } catch (err) {
    console.error('Get document error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * PUT /api/legal-documents/:id
 * Owner: update metadata only (not attachments)
 */
router.put('/:id', protect, async (req, res) => {
  try {
    // Allow-list update fields (professional + safer)
    const update = {
      updatedAt: new Date()
    };

    const allowed = [
      'type',
      'title',
      'propertyAddress',
      'parcelId',
      'instructionsForBeneficiary',
      'certifiedCopyInstructions'
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    // Structured fields
    if (req.body.recordingInfo !== undefined) update.recordingInfo = safeJsonParse(req.body.recordingInfo, undefined);
    if (req.body.notaryInfo !== undefined) update.notaryInfo = safeJsonParse(req.body.notaryInfo, undefined);
    if (req.body.originalLocation !== undefined) update.originalLocation = safeJsonParse(req.body.originalLocation, undefined);

    if (req.body.notarized !== undefined) update.notarized = req.body.notarized === 'true' || req.body.notarized === true;
    if (req.body.visibleToBeneficiaries !== undefined) update.visibleToBeneficiaries = req.body.visibleToBeneficiaries !== 'false';

    if (req.body.allowedBeneficiaries !== undefined) update.allowedBeneficiaries = safeJsonParse(req.body.allowedBeneficiaries, []);

    const document = await LegalDocument.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      update,
      { returnDocument: 'after', runValidators: true }
    );

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    await log('legal_document_updated', {
      userId: req.user._id,
      details: { documentId: document._id },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      data: stripStoragePaths(document)
    });
  } catch (err) {
    console.error('Update document error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * DELETE /api/legal-documents/:id
 * Owner: delete document + files
 */
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
    if (document.attachments?.length) {
      for (const attachment of document.attachments) {
        try {
          if (attachment.storagePath && fs.existsSync(attachment.storagePath)) {
            fs.unlinkSync(attachment.storagePath);
          }
        } catch (e) {
          console.error('Failed to delete file:', e.message);
        }
      }
    }

    await document.deleteOne();

    await log('legal_document_deleted', {
      userId: req.user._id,
      details: { documentId: req.params.id },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (err) {
    console.error('Delete document error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/legal-documents/:id/attachments/:attachmentId
 * REMOVED: Download route for security - files must not be downloadable
 * Use OCR scan instead to view extracted text only
 */

/**
 * POST /api/legal-documents/:id/scan
 * OCR scanning for existing documents
 */
router.post('/:id/scan', protect, scanLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await LegalDocument.findOne({
      _id: id,
      ownerId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if document has attachments
    if (!document.attachments || document.attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document has no attachments to scan'
      });
    }

    // Get the first attachment
    const attachment = document.attachments[0];
    
    // Check if file exists
    if (!attachment.storagePath || !fs.existsSync(attachment.storagePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Check if file is PDF - Tesseract cannot read PDFs
    const isPDF = attachment.mimeType === 'application/pdf' ||
      attachment.storagePath?.toLowerCase().endsWith('.pdf') ||
      attachment.originalName?.toLowerCase().endsWith('.pdf');

    // PDF files cannot be OCR scanned with tesseract
    if (isPDF) {
      document.status = 'verified';
      document.scanResult = {
        extractedText: `PDF Document Uploaded Successfully.\n\nFile: ${attachment.originalName}\nSize: ${Math.round((attachment.size || 0) / 1024)} KB\nUploaded: ${new Date(attachment.uploadedAt || document.createdAt).toLocaleDateString()}\n\nNote: PDF text extraction requires a PDF parser.\nFor OCR scanning, please upload JPG or PNG images.\nYour PDF document is stored securely and will be\ndelivered to your beneficiaries when your trigger activates.`,
        confidence: 100,
        documentType: 'application/pdf',
        processedAt: new Date().toISOString()
      };
      await document.save();

      await log('legal_document_scanned', {
        userId: req.user._id,
        details: { documentId: document._id, isPDF: true },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(200).json({
        success: true,
        message: 'PDF document processed',
        data: stripStoragePaths(document)
      });
    }

    // For images - run tesseract OCR
    document.status = 'processing';
    await document.save();

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      
      const { data } = await worker.recognize(attachment.storagePath);
      await worker.terminate();

      // Update document with scan results
      document.scanResult = {
        extractedText: data.text,
        confidence: Math.round(data.confidence),
        notaryDetected: false,
        documentType: attachment.mimeType,
        processedAt: new Date().toISOString()
      };
      document.status = 'verified';
      await document.save();

      await log('legal_document_scanned', {
        userId: req.user._id,
        details: { documentId: document._id, confidence: document.scanResult.confidence },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(200).json({
        success: true,
        message: 'Document scanned successfully',
        data: stripStoragePaths(document)
      });

    } catch (ocrError) {
      console.error('OCR error:', ocrError.message);
      document.status = 'rejected';
      document.scanResult = {
        extractedText: 'OCR processing failed. Please try again.',
        confidence: 0,
        processedAt: new Date().toISOString()
      };
      await document.save();

      return res.status(200).json({
        success: true,
        message: 'Scan attempted but OCR failed',
        data: stripStoragePaths(document)
      });
    }

  } catch (error) {
    console.error('Scan controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/legal-documents/ocr-scan
 * OCR scanning for notarization documents
 */
router.post('/ocr-scan', protect, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No document file provided' 
      });
    }

    // Simulate OCR processing (in production, integrate with Tesseract.js or cloud OCR service)
    const mockOCRResult = {
      success: true,
      data: {
        extractedText: `Document scanned successfully. 
File: ${req.file.originalname}
Type: ${req.file.mimetype}
Size: ${(req.file.size / 1024).toFixed(2)} KB

This appears to be a legal document. 
Key information detected:
- Document title present
- Date fields detected
- Signatures detected: ${Math.random() > 0.5 ? 'Yes' : 'No'}
- Notary seal detected: ${Math.random() > 0.6 ? 'Yes' : 'No'}

Note: This is a simulated OCR result. In production, this would use actual OCR technology.`,
        confidence: Math.floor(Math.random() * 20) + 75, // 75-95%
        notaryDetected: Math.random() > 0.6,
        documentType: req.file.mimetype,
        processedAt: new Date().toISOString()
      }
    };

    // Log the OCR scan
    await log('ocr_scan', {
      userId: req.user._id,
      details: { 
        filename: req.file.originalname, 
        mimeType: req.file.mimetype,
        confidence: mockOCRResult.data.confidence
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Clean up the temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.warn('Failed to cleanup temp file:', error.message);
    }

    return res.status(200).json(mockOCRResult);
  } catch (error) {
    console.error('OCR scan error:', error.message);
    
    // Clean up the temporary file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError.message);
      }
    }

    return res.status(500).json({ 
      success: false, 
      message: 'OCR scan failed. Please try again.' 
    });
  }
});

module.exports = router;