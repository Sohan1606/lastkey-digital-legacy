const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const LegalDocument = require('../models/LegalDocument');
const { protect } = require('../middleware/auth');
const { log } = require('../services/auditService');

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
router.post('/', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      type,
      title,
      propertyAddress,
      parcelId,
      instructionsForBeneficiary,
      certifiedCopyInstructions
    } = req.body;

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

    // Process uploaded files
    const attachments = [];
    if (req.files?.length) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileBuffer = fs.readFileSync(file.path);
        const sha256Hash = LegalDocument.computeHash(fileBuffer);

        // Optional per-file IV from client
        const ivB64 =
          req.body[`attachmentIv_${i}`] ||
          req.body[`attachmentIv_${file.originalname}`] ||
          undefined;

        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          sha256Hash,
          encrypted: clientEncrypted,
          ivB64, // NOTE: you must add ivB64 to schema (next step)
          encryptionVersion, // optional; add to schema if you want to persist
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
      recordingInfo,
      notarized,
      notaryInfo,
      originalLocation,
      instructionsForBeneficiary,
      certifiedCopyInstructions,
      attachments,
      visibleToBeneficiaries,
      allowedBeneficiaries
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
    console.error('Create document error:', err.message);

    // Clean up uploaded files on error
    if (req.files?.length) {
      for (const file of req.files) {
        try {
          fs.unlinkSync(file.path);
        } catch (_) {}
      }
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
      { new: true, runValidators: true }
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
 * Owner: download attachment bytes (ciphertext if encrypted)
 */
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

    if (!attachment.storagePath || !fs.existsSync(attachment.storagePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    await log('legal_document_downloaded', {
      userId: req.user._id,
      details: { documentId: document._id, attachmentId, filename: attachment.originalName },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('X-Encrypted', attachment.encrypted ? 'true' : 'false');
    if (attachment.sha256Hash) res.setHeader('X-SHA256', attachment.sha256Hash);

    return res.sendFile(path.resolve(attachment.storagePath));
  } catch (err) {
    console.error('Download error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;