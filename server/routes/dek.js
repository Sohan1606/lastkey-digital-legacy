const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const DataEncryptionKey = require('../models/DataEncryptionKey');
const auditService = require('../services/auditService');

/**
 * DEK (Data Encryption Key) Routes
 * 
 * These endpoints handle the server-side storage and retrieval of encrypted DEKs.
 * The actual encryption/decryption happens client-side - server never sees plaintext.
 */

// Initialize DEK for a new user
router.post('/initialize', protect, async (req, res) => {
  try {
    const { encryptedMasterKey, keyVerification } = req.body;
    
    if (!encryptedMasterKey || !keyVerification) {
      return res.status(400).json({ 
        success: false, 
        message: 'Encrypted master key and key verification required' 
      });
    }
    
    // Check if DEK already exists
    const existingDEK = await DataEncryptionKey.findOne({ ownerId: req.user._id });
    if (existingDEK) {
      return res.status(409).json({ 
        success: false, 
        message: 'DEK already initialized for this user' 
      });
    }
    
    const dek = new DataEncryptionKey({
      ownerId: req.user._id,
      encryptedMasterKey,
      keyVerification,
      beneficiaryShares: []
    });
    
    await dek.save();
    
    await auditService.log({
      userId: req.user._id,
      event: 'DEK_INITIALIZED',
      details: { version: encryptedMasterKey.version || '1' }
    });
    
    res.status(201).json({
      success: true,
      message: 'DEK initialized successfully'
    });
  } catch (err) {
    console.error('DEK initialization error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize DEK' 
    });
  }
});

// Get user's encrypted DEK
router.get('/my-dek', protect, async (req, res) => {
  try {
    const dek = await DataEncryptionKey.findOne({ ownerId: req.user._id });
    
    if (!dek) {
      return res.status(404).json({
        success: false,
        message: 'DEK not found. Please initialize your vault first.',
        code: 'DEK_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: {
        encryptedMasterKey: dek.encryptedMasterKey,
        keyVerification: dek.keyVerification,
        hasShares: dek.beneficiaryShares.length > 0,
        shareCount: dek.beneficiaryShares.length,
        rotatedAt: dek.rotatedAt,
        rotationCount: dek.rotationCount
      }
    });
  } catch (err) {
    console.error('DEK retrieval error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve DEK' 
    });
  }
});

// Check if DEK exists (lightweight check)
router.get('/status', protect, async (req, res) => {
  try {
    const dek = await DataEncryptionKey.findOne({ ownerId: req.user._id });
    
    res.json({
      success: true,
      data: {
        initialized: !!dek,
        hasShares: dek ? dek.beneficiaryShares.length > 0 : false,
        shareCount: dek ? dek.beneficiaryShares.length : 0
      }
    });
  } catch (err) {
    console.error('DEK status error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check DEK status' 
    });
  }
});

// Rotate DEK (update encrypted version)
router.post('/rotate', protect, async (req, res) => {
  try {
    const { encryptedMasterKey, keyVerification } = req.body;
    
    if (!encryptedMasterKey || !keyVerification) {
      return res.status(400).json({ 
        success: false, 
        message: 'New encrypted master key and key verification required' 
      });
    }
    
    const dek = await DataEncryptionKey.findOne({ ownerId: req.user._id });
    if (!dek) {
      return res.status(404).json({ 
        success: false, 
        message: 'DEK not found' 
      });
    }
    
    dek.encryptedMasterKey = encryptedMasterKey;
    dek.keyVerification = keyVerification;
    dek.rotatedAt = new Date();
    dek.rotationCount += 1;
    
    await dek.save();
    
    await auditService.log({
      userId: req.user._id,
      event: 'DEK_ROTATED',
      details: { rotationCount: dek.rotationCount }
    });
    
    res.json({
      success: true,
      message: 'DEK rotated successfully'
    });
  } catch (err) {
    console.error('DEK rotation error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to rotate DEK' 
    });
  }
});

// Add beneficiary share
router.post('/beneficiary-shares', protect, async (req, res) => {
  try {
    const { beneficiaryId, encryptedShare } = req.body;
    
    if (!beneficiaryId || !encryptedShare) {
      return res.status(400).json({ 
        success: false, 
        message: 'Beneficiary ID and encrypted share required' 
      });
    }
    
    const dek = await DataEncryptionKey.findOne({ ownerId: req.user._id });
    if (!dek) {
      return res.status(404).json({ 
        success: false, 
        message: 'DEK not found' 
      });
    }
    
    // Check if share already exists
    if (dek.hasActiveShare(beneficiaryId)) {
      return res.status(409).json({ 
        success: false, 
        message: 'Beneficiary already has an active share' 
      });
    }
    
    dek.beneficiaryShares.push({
      beneficiaryId,
      encryptedShare,
      grantedAt: new Date()
    });
    
    await dek.save();
    
    await auditService.log({
      userId: req.user._id,
      event: 'BENEFICIARY_SHARE_ADDED',
      details: { beneficiaryId }
    });
    
    res.status(201).json({
      success: true,
      message: 'Beneficiary share added successfully'
    });
  } catch (err) {
    console.error('Beneficiary share error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add beneficiary share' 
    });
  }
});

// Get beneficiary's share (for beneficiary portal)
router.get('/my-share', protect, async (req, res) => {
  try {
    // req.user is the beneficiary in this context
    const dek = await DataEncryptionKey.findOne({
      'beneficiaryShares.beneficiaryId': req.user._id,
      'beneficiaryShares.revokedAt': null
    });
    
    if (!dek) {
      return res.status(404).json({
        success: false,
        message: 'No DEK share found for this beneficiary'
      });
    }
    
    const share = dek.getActiveShare(req.user._id);
    
    // Record access
    await dek.recordBeneficiaryAccess(req.user._id);
    
    await auditService.log({
      userId: req.user._id,
      event: 'BENEFICIARY_SHARE_ACCESSED',
      details: { ownerId: dek.ownerId }
    });
    
    res.json({
      success: true,
      data: {
        encryptedShare: share.encryptedShare,
        grantedAt: share.grantedAt
      }
    });
  } catch (err) {
    console.error('Share retrieval error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve share' 
    });
  }
});

// Revoke beneficiary share
router.delete('/beneficiary-shares/:beneficiaryId', protect, async (req, res) => {
  try {
    const dek = await DataEncryptionKey.findOne({ ownerId: req.user._id });
    if (!dek) {
      return res.status(404).json({ 
        success: false, 
        message: 'DEK not found' 
      });
    }
    
    await dek.revokeBeneficiaryAccess(req.params.beneficiaryId);
    
    await auditService.log({
      userId: req.user._id,
      event: 'BENEFICIARY_SHARE_REVOKED',
      details: { beneficiaryId: req.params.beneficiaryId }
    });
    
    res.json({
      success: true,
      message: 'Beneficiary share revoked successfully'
    });
  } catch (err) {
    console.error('Share revocation error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to revoke share' 
    });
  }
});

module.exports = router;
