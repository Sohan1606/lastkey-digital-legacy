const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  getAllBeneficiaries, 
  createBeneficiary, 
  updateBeneficiary, 
  deleteBeneficiary 
} = require('../controllers/beneficiaryController');
const { validate, createBeneficiarySchema, updateBeneficiarySchema } = require('../validators');
const Beneficiary = require('../models/Beneficiary');
const { log } = require('../services/auditService');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllBeneficiaries)
  .post(validate(createBeneficiarySchema), createBeneficiary);

router
  .route('/:id')
  .patch(validate(updateBeneficiarySchema), updateBeneficiary)
  .delete(deleteBeneficiary);

/**
 * GET /api/beneficiaries/:id/public-key
 * Get beneficiary's public key for DEK encryption
 */
router.get('/:id/public-key', async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('encryptionKeys.publicKeyJwk enrollmentStatus');
    
    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }
    
    if (beneficiary.enrollmentStatus !== 'enrolled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Beneficiary not yet enrolled' 
      });
    }
    
    if (!beneficiary.encryptionKeys?.publicKeyJwk) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary has no encryption key. They need to complete enrollment.'
      });
    }
    
    res.json({
      success: true,
      data: {
        publicKeyJwk: beneficiary.encryptionKeys.publicKeyJwk
      }
    });
  } catch (err) {
    console.error('Get public key error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/beneficiaries/:id/dek-share
 * Store DEK share for beneficiary (encrypted with their public key)
 */
router.post('/:id/dek-share', async (req, res) => {
  try {
    const { encryptedDekB64 } = req.body;
    
    if (!encryptedDekB64) {
      return res.status(400).json({
        success: false,
        message: 'encryptedDekB64 is required'
      });
    }
    
    const beneficiary = await Beneficiary.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }
    
    if (beneficiary.enrollmentStatus !== 'enrolled') {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary not yet enrolled'
      });
    }
    
    // Store the encrypted DEK share
    beneficiary.vaultShare = {
      encryptedDekB64,
      dekShareVersion: '1',
      dekShareCreatedAt: new Date(),
      dekShareUpdatedAt: new Date()
    };
    
    await beneficiary.save();
    
    // Log the share creation
    await log('beneficiary_dek_share_created', {
      userId: req.user._id,
      details: { beneficiaryId: beneficiary._id }
    });
    
    res.json({
      success: true,
      message: 'DEK share stored successfully'
    });
  } catch (err) {
    console.error('Store DEK share error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/beneficiaries/:id/revoke-portal
 * SECURITY LAYER 5: Revoke portal access for beneficiary
 */
router.post('/:id/revoke-portal', async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    const BeneficiaryAccess = require('../models/BeneficiaryAccess');
    const access = await BeneficiaryAccess.findOne({
      beneficiaryId: beneficiary._id,
      isRevoked: false
    });

    if (!access) {
      return res.status(404).json({ success: false, message: 'No active portal access found' });
    }

    access.isRevoked = true;
    await access.save();

    // Log the revocation
    await log('PORTAL_ACCESS_REVOKED', {
      userId: req.user._id,
      details: { beneficiaryId: beneficiary._id, accessId: access._id }
    });

    // Send email to beneficiary
    const { sendEmail } = require('../utils/email');
    const User = require('../models/User');
    const owner = await User.findById(req.user._id).select('name email');

    await sendEmail({
      to: beneficiary.email,
      subject: 'LastKey: Portal Access Revoked',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
          <h2 style="color:#ff4d6d;margin-bottom:16px">Portal Access Revoked</h2>
          <p>Your access to <strong>${owner.name}'s</strong> digital legacy portal has been revoked.</p>
          <p>Contact <strong>${owner.name}</strong> for more information.</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Portal access revoked successfully'
    });
  } catch (err) {
    console.error('Revoke portal error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/beneficiaries/:id/resend-portal
 * SECURITY LAYER 5: Resend portal access link (creates new token, invalidates old)
 */
router.post('/:id/resend-portal', async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    const BeneficiaryAccess = require('../models/BeneficiaryAccess');
    const Asset = require('../models/Asset');
    const crypto = require('crypto');

    // Revoke any existing access
    await BeneficiaryAccess.updateMany(
      { beneficiaryId: beneficiary._id, isRevoked: false },
      { isRevoked: true }
    );

    // Generate new token (SECURITY LAYER 6: 64 bytes)
    const token = crypto.randomBytes(64).toString('hex');

    // Get assigned vault items
    const assignedItems = await Asset.find({
      ownerId: req.user._id,
      _id: { $in: beneficiary.assignedVaultItems || [] }
    });

    // Create new access record
    const access = await BeneficiaryAccess.create({
      token,
      beneficiaryId: beneficiary._id,
      ownerId: req.user._id,
      assignedItems: assignedItems.map(item => item._id),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Log the resend
    await log('PORTAL_ACCESS_RESENT', {
      userId: req.user._id,
      details: { beneficiaryId: beneficiary._id, newAccessId: access._id }
    });

    // Send email with new link
    const { sendEmail } = require('../utils/email');
    const env = require('../config/env').env;
    const portalUrl = `${env.FRONTEND_URL}/portal/${token}`;

    await sendEmail({
      to: beneficiary.email,
      subject: 'LastKey: New Portal Access Link',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
          <h2 style="color:#4f9eff;margin-bottom:16px">New Portal Access Link</h2>
          <p>A new access link has been generated for you to access <strong>digital legacy items</strong>.</p>
          <p style="margin:24px 0">
            <a href="${portalUrl}"
               style="background:linear-gradient(135deg,#4f9eff,#7c5cfc);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">
              Access Your Items
            </a>
          </p>
          <p style="color:#8899bb;font-size:12px">This link expires in 30 days. Previous links have been invalidated.</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'New portal access link sent successfully'
    });
  } catch (err) {
    console.error('Resend portal error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/beneficiaries/:id/portal-status
 * SECURITY LAYER 5: Get portal access status for beneficiary
 */
router.get('/:id/portal-status', async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    const BeneficiaryAccess = require('../models/BeneficiaryAccess');
    const access = await BeneficiaryAccess.findOne({
      beneficiaryId: beneficiary._id,
      isRevoked: false
    }).sort({ createdAt: -1 });

    if (!access) {
      return res.json({
        success: true,
        data: {
          hasAccess: false,
          message: 'No portal access activated'
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasAccess: true,
        isRevoked: access.isRevoked,
        expiresAt: access.expiresAt,
        accessCount: access.accessCount,
        lastAccessed: access.accessedAt,
        firstAccessDevice: access.firstAccessDevice,
        lastAccessDevice: access.lastAccessDevice,
        createdAt: access.createdAt
      }
    });
  } catch (err) {
    console.error('Portal status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/beneficiaries/dek-share/sync
 * Get list of beneficiaries needing DEK shares
 */
router.post('/dek-share/sync', async (req, res) => {
  try {
    // Find all enrolled beneficiaries without DEK shares
    const beneficiaries = await Beneficiary.find({
      userId: req.user._id,
      enrollmentStatus: 'enrolled'
    }).select('name email encryptionKeys.publicKeyJwk vaultShare.encryptedDekB64');
    
    const needingShares = beneficiaries.filter(b => 
      b.encryptionKeys?.publicKeyJwk && !b.vaultShare?.encryptedDekB64
    );
    
    const withShares = beneficiaries.filter(b => 
      b.vaultShare?.encryptedDekB64
    );
    
    res.json({
      success: true,
      data: {
        needingShares: needingShares.map(b => ({
          id: b._id,
          name: b.name,
          email: b.email,
          publicKeyJwk: b.encryptionKeys.publicKeyJwk
        })),
        withShares: withShares.map(b => ({
          id: b._id,
          name: b.name,
          email: b.email,
          updatedAt: b.vaultShare.dekShareUpdatedAt
        })),
        total: beneficiaries.length,
        needingCount: needingShares.length,
        syncedCount: withShares.length
      }
    });
  } catch (err) {
    console.error('DEK share sync error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
