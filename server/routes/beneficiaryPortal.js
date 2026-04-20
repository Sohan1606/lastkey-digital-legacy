const express = require('express');
const Asset = require('../models/Asset');
const Capsule = require('../models/Capsule');
const User = require('../models/User');
const EmergencySession = require('../models/EmergencySession');
const { log } = require('../services/auditService');

const router = express.Router();

// Lazy load protectBeneficiary to avoid circular dependency issues
const getProtectBeneficiary = () => {
  const { protectBeneficiary } = require('./beneficiaryAuth');
  return protectBeneficiary;
};

// Middleware to validate emergency session
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

    // Check if owner is still triggered
    const owner = await User.findById(session.ownerId).select('triggerStatus');
    if (owner.triggerStatus !== 'triggered') {
      // Owner came back, revoke all sessions
      await session.revoke('Owner reactivated');
      return res.status(403).json({ 
        success: false, 
        message: 'Access revoked - owner has reactivated their account' 
      });
    }

    // Extend session
    await session.extend();

    req.session = session;
    req.scopes = session.grantId?.scopes || {};
    next();
  } catch (err) {
    console.error('Session validation error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get owner's assets (scoped)
router.get('/assets', (req, res, next) => getProtectBeneficiary()(req, res, next), validateSession, async (req, res) => {
  try {
    const { beneficiary, owner, scopes } = req;

    if (!scopes.viewAssets) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const assets = await Asset.find({ userId: owner._id })
      .select('-password -clientEncrypted') // Never return passwords
      .lean();

    // Log access
    await log('beneficiary_assets_viewed', {
      userId: owner._id,
      details: { 
        beneficiaryId: beneficiary._id,
        count: assets.length 
      },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: assets
    });
  } catch (err) {
    console.error('Get assets error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get owner's capsules (scoped)
router.get('/capsules', (req, res, next) => getProtectBeneficiary()(req, res, next), validateSession, async (req, res) => {
  try {
    const { beneficiary, owner, scopes } = req;

    if (!scopes.viewCapsules) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const capsules = await Capsule.find({ 
      userId: owner._id,
      $or: [
        { isReleased: true },
        { triggerType: 'inactivity', isFinalMessage: true }
      ]
    }).lean();

    // Log access
    await log('beneficiary_capsules_viewed', {
      userId: owner._id,
      details: { 
        beneficiaryId: beneficiary._id,
        count: capsules.length 
      },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: capsules
    });
  } catch (err) {
    console.error('Get capsules error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get owner info (limited)
router.get('/owner-info', (req, res, next) => getProtectBeneficiary()(req, res, next), validateSession, async (req, res) => {
  try {
    const { beneficiary, owner } = req;

    res.status(200).json({
      success: true,
      data: {
        name: owner.name,
        triggerStatus: owner.triggerStatus,
        // Intentionally limited - no email, phone, etc.
      }
    });
  } catch (err) {
    console.error('Get owner info error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Download asset credentials (with audit)
router.get('/assets/:assetId/download', (req, res, next) => getProtectBeneficiary()(req, res, next), validateSession, async (req, res) => {
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

    // Note: Password is client-encrypted, so we return ciphertext
    // Beneficiary must decrypt locally with their unlock secret
    const content = `
${asset.platform} Credentials
${'='.repeat(40)}
Username: ${asset.username}
Password (Encrypted): ${asset.password}
Note: This password is encrypted. Use your unlock secret to decrypt.
${'='.repeat(40)}
Generated: ${new Date().toISOString()}
Accessed by: ${beneficiary.name} (${beneficiary.relationship})
`;

    // Log download
    await log('beneficiary_asset_downloaded', {
      userId: owner._id,
      details: { 
        beneficiaryId: beneficiary._id,
        assetId: asset._id,
        platform: asset.platform
      },
      ip: req.ip
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${asset.platform}-credentials.txt"`);
    res.send(content);
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
