const express = require('express');
const fs = require('fs');

const Asset = require('../models/Asset');
const Capsule = require('../models/Capsule');
const User = require('../models/User');
const LegalDocument = require('../models/LegalDocument');
const Beneficiary = require('../models/Beneficiary');
const EmergencySession = require('../models/EmergencySession');
const { log } = require('../services/auditService');

const router = express.Router();

/**
 * Lazy load protectBeneficiaryEnrolled to avoid circular dependency issues.
 * NOTE: beneficiaryAuth.js exports the router function with properties:
 *   router.protectBeneficiaryEnrolled = ...
 * so destructuring works: const { protectBeneficiaryEnrolled } = require('./beneficiaryAuth')
 */
const getProtectBeneficiaryEnrolled = () => {
  const mod = require('./beneficiaryAuth');
  const protectBeneficiaryEnrolled = mod?.protectBeneficiaryEnrolled;
  if (typeof protectBeneficiaryEnrolled !== 'function') {
    throw new Error(
      'protectBeneficiaryEnrolled is not exported correctly from beneficiaryAuth.js. ' +
      'Ensure beneficiaryAuth sets router.protectBeneficiaryEnrolled = fn.'
    );
  }
  return protectBeneficiaryEnrolled;
};

/**
 * Middleware: validate emergency session (x-session-token) and bind it to the authenticated beneficiary.
 */
const validateSession = async (req, res, next) => {
  try {
    const token = req.headers['x-session-token'];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No session token' });
    }

    const tokenHash = EmergencySession.hashToken(token);
    const session = await EmergencySession.findOne({
      sessionTokenHash: tokenHash,
      status: 'active'
    }).populate('grantId');

    if (!session || !session.isValid()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    // Bind session to the logged-in beneficiary + owner for replay protection
    // (Requires protectBeneficiaryEnrolled to have already set req.beneficiary and req.owner)
    if (!req.beneficiary || !req.owner) {
      return res.status(500).json({ success: false, message: 'Session validation order error' });
    }

    if (String(session.beneficiaryId) !== String(req.beneficiary._id)) {
      return res.status(403).json({ success: false, message: 'Session does not belong to this beneficiary' });
    }

    if (String(session.ownerId) !== String(req.owner._id)) {
      return res.status(403).json({ success: false, message: 'Session does not match this owner' });
    }

    // Check if owner is still triggered
    const ownerState = await User.findById(session.ownerId).select('triggerStatus');
    if (!ownerState || ownerState.triggerStatus !== 'triggered') {
      await session.revoke('Owner reactivated or missing');
      return res.status(403).json({
        success: false,
        message: 'Access revoked — owner has reactivated their account'
      });
    }

    // Extend session on activity
    await session.extend();

    req.session = session;
    req.scopes = session.grantId?.scopes || {};
    next();
  } catch (err) {
    console.error('Session validation error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Assets (ciphertext only; beneficiary decrypts locally)
 */
router.get(
  '/assets',
  (req, res, next) => getProtectBeneficiaryEnrolled()(req, res, next),
  validateSession,
  async (req, res) => {
    try {
      const { beneficiary, owner, scopes } = req;

      if (!scopes.viewAssets) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const assets = await Asset.find({ userId: owner._id })
        // Return encrypted password ciphertext; remove clientEncrypted flag only
        .select('-clientEncrypted')
        .lean();

      await log('beneficiary_assets_viewed', {
        userId: owner._id,
        details: { beneficiaryId: beneficiary._id, count: assets.length },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(200).json({ success: true, data: assets });
    } catch (err) {
      console.error('Get assets error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * Capsules (released/final messages)
 */
router.get(
  '/capsules',
  (req, res, next) => getProtectBeneficiaryEnrolled()(req, res, next),
  validateSession,
  async (req, res) => {
    try {
      const { beneficiary, owner, scopes } = req;

      if (!scopes.viewCapsules) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const capsules = await Capsule.find({
        userId: owner._id,
        $or: [{ isReleased: true }, { triggerType: 'inactivity', isFinalMessage: true }]
      }).lean();

      await log('beneficiary_capsules_viewed', {
        userId: owner._id,
        details: { beneficiaryId: beneficiary._id, count: capsules.length },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(200).json({ success: true, data: capsules });
    } catch (err) {
      console.error('Get capsules error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * Owner info (limited)
 */
router.get(
  '/owner-info',
  (req, res, next) => getProtectBeneficiaryEnrolled()(req, res, next),
  validateSession,
  async (req, res) => {
    try {
      const { owner } = req;

      return res.status(200).json({
        success: true,
        data: {
          name: owner.name,
          triggerStatus: owner.triggerStatus
        }
      });
    } catch (err) {
      console.error('Get owner info error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * Download asset credentials (ciphertext; decrypt locally in portal)
 */
router.get(
  '/assets/:assetId/download',
  (req, res, next) => getProtectBeneficiaryEnrolled()(req, res, next),
  validateSession,
  async (req, res) => {
    try {
      const { beneficiary, owner, scopes } = req;
      const { assetId } = req.params;

      if (!scopes.downloadFiles) {
        return res.status(403).json({ success: false, message: 'Download not permitted' });
      }

      const asset = await Asset.findOne({ _id: assetId, userId: owner._id });
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      const content = `
${asset.platform} Credentials
${'='.repeat(48)}
Username: ${asset.username || ''}
Password (Encrypted Ciphertext): ${asset.password || ''}
Note: This password is encrypted. Use the Beneficiary Portal vault unlock to decrypt locally.
${'='.repeat(48)}
Generated: ${new Date().toISOString()}
Accessed by: ${beneficiary.name} (${beneficiary.relationship})
`;

      await log('beneficiary_asset_downloaded', {
        userId: owner._id,
        details: { beneficiaryId: beneficiary._id, assetId: asset._id, platform: asset.platform },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${asset.platform}-credentials.txt"`);
      return res.send(content);
    } catch (err) {
      console.error('Download error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * Vault share: encrypted DEK + encrypted private key blob
 */
router.get(
  '/vault-share',
  (req, res, next) => getProtectBeneficiaryEnrolled()(req, res, next),
  validateSession,
  async (req, res) => {
    try {
      const { beneficiary, scopes } = req;

      if (!scopes.viewAssets) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const beneficiaryWithShare = await Beneficiary.findById(beneficiary._id).select(
        'vaultShare encryptionKeys.encryptedPrivateKeyBlob'
      );

      if (!beneficiaryWithShare?.vaultShare?.encryptedDekB64) {
        return res.status(404).json({
          success: false,
          message: 'No vault share found. Owner must create DEK share first.'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          encryptedDekB64: beneficiaryWithShare.vaultShare.encryptedDekB64,
          encryptedPrivateKeyBlob: beneficiaryWithShare.encryptionKeys?.encryptedPrivateKeyBlob,
          grantedAt: beneficiaryWithShare.vaultShare.dekShareCreatedAt
        }
      });
    } catch (err) {
      console.error('Vault share error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * Legal Documents list (scoped)
 */
router.get(
  '/legal-documents',
  (req, res, next) => getProtectBeneficiaryEnrolled()(req, res, next),
  validateSession,
  async (req, res) => {
    try {
      const { beneficiary, owner, scopes } = req;

      if (!scopes.viewDocuments) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const documents = await LegalDocument.find({
        ownerId: owner._id,
        visibleToBeneficiaries: true,
        $or: [{ allowedBeneficiaries: { $size: 0 } }, { allowedBeneficiaries: beneficiary._id }]
      })
        .select('-attachments.storagePath')
        .lean();

      await log('beneficiary_documents_viewed', {
        userId: owner._id,
        details: { beneficiaryId: beneficiary._id, count: documents.length },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(200).json({ success: true, data: documents });
    } catch (err) {
      console.error('Get documents error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * Attachment metadata (scoped + allowedBeneficiaries enforced)
 */
router.get(
  '/legal-documents/:docId/attachments/:attachmentId/meta',
  (req, res, next) => getProtectBeneficiaryEnrolled()(req, res, next),
  validateSession,
  async (req, res) => {
    try {
      const { beneficiary, owner, scopes } = req;
      const { docId, attachmentId } = req.params;

      if (!scopes.viewDocuments) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const document = await LegalDocument.findOne({
        _id: docId,
        ownerId: owner._id,
        visibleToBeneficiaries: true,
        $or: [{ allowedBeneficiaries: { $size: 0 } }, { allowedBeneficiaries: beneficiary._id }]
      });

      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const attachment = document.attachments.id(attachmentId);
      if (!attachment) {
        return res.status(404).json({ success: false, message: 'Attachment not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          filename: attachment.originalName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          sha256Hash: attachment.sha256Hash,
          encrypted: !!attachment.encrypted,
          ivB64: attachment.ivB64 || null
        }
      });
    } catch (err) {
      console.error('Attachment meta error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * Stream attachment file bytes (ciphertext if encrypted)
 */
router.get(
  '/legal-documents/:docId/attachments/:attachmentId/file',
  (req, res, next) => getProtectBeneficiaryEnrolled()(req, res, next),
  validateSession,
  async (req, res) => {
    try {
      const { beneficiary, owner, scopes } = req;
      const { docId, attachmentId } = req.params;

      if (!scopes.downloadFiles) {
        return res.status(403).json({ success: false, message: 'Download not permitted' });
      }

      const document = await LegalDocument.findOne({
        _id: docId,
        ownerId: owner._id,
        visibleToBeneficiaries: true,
        $or: [{ allowedBeneficiaries: { $size: 0 } }, { allowedBeneficiaries: beneficiary._id }]
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

      await log('beneficiary_document_downloaded', {
        userId: owner._id,
        details: {
          beneficiaryId: beneficiary._id,
          documentId: docId,
          attachmentId,
          filename: attachment.originalName
        },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
      res.setHeader('X-Encrypted', attachment.encrypted ? 'true' : 'false');
      if (attachment.sha256Hash) res.setHeader('X-SHA256', attachment.sha256Hash);

      const stream = fs.createReadStream(attachment.storagePath);
      return stream.pipe(res);
    } catch (err) {
      console.error('File download error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router;