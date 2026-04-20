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
