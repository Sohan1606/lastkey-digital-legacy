/**
 * Vault Key Routes
 * 
 * Manages the owner's Data Encryption Key (DEK):
 * - DEK is generated client-side and never sent plaintext to server
 * - Server only stores the wrapped (encrypted) DEK
 * - Owner password derives KEK which wraps/unwrapped DEK
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { log } = require('../services/auditService');

/**
 * GET /api/vault-key/status
 * Check if vault DEK is initialized
 */
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('vault');
    
    const hasWrappedDek = !!(user.vault?.wrappedDek?.ciphertextB64);
    
    res.json({
      success: true,
      data: {
        hasWrappedDek,
        createdAt: user.vault?.createdAt,
        updatedAt: user.vault?.updatedAt
      }
    });
  } catch (err) {
    console.error('Vault status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/vault-key/initialize
 * Initialize vault with wrapped DEK (first time setup)
 */
router.post('/initialize', protect, async (req, res) => {
  try {
    const { wrappedDek } = req.body;
    
    // Validate required fields
    if (!wrappedDek || !wrappedDek.saltB64 || !wrappedDek.ivB64 || !wrappedDek.ciphertextB64) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wrapped DEK format. Required: saltB64, ivB64, ciphertextB64'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Check if already initialized
    if (user.vault?.wrappedDek?.ciphertextB64) {
      return res.status(409).json({
        success: false,
        message: 'Vault already initialized. Use rotate to change DEK.'
      });
    }
    
    // Store wrapped DEK
    user.vault = {
      wrappedDek: {
        saltB64: wrappedDek.saltB64,
        iterations: wrappedDek.iterations || 100000,
        ivB64: wrappedDek.ivB64,
        ciphertextB64: wrappedDek.ciphertextB64,
        version: wrappedDek.version || '1'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await user.save();
    
    // Log initialization
    await log('vault_initialized', {
      userId: user._id,
      details: { version: wrappedDek.version || '1' }
    });
    
    res.status(201).json({
      success: true,
      message: 'Vault initialized successfully'
    });
  } catch (err) {
    console.error('Vault initialize error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/vault-key/wrapped-dek
 * Get the wrapped DEK for client-side unwrapping
 */
router.get('/wrapped-dek', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('vault');
    
    if (!user.vault?.wrappedDek?.ciphertextB64) {
      return res.status(404).json({
        success: false,
        message: 'Vault not initialized',
        code: 'VAULT_NOT_INITIALIZED'
      });
    }
    
    res.json({
      success: true,
      data: {
        wrappedDek: user.vault.wrappedDek
      }
    });
  } catch (err) {
    console.error('Get wrapped DEK error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/vault-key/rotate
 * Rotate DEK (re-encrypt with new KEK)
 */
router.post('/rotate', protect, async (req, res) => {
  try {
    const { wrappedDek } = req.body;
    
    if (!wrappedDek || !wrappedDek.saltB64 || !wrappedDek.ivB64 || !wrappedDek.ciphertextB64) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wrapped DEK format'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user.vault?.wrappedDek?.ciphertextB64) {
      return res.status(404).json({
        success: false,
        message: 'Vault not initialized'
      });
    }
    
    // Update wrapped DEK
    user.vault.wrappedDek = {
      saltB64: wrappedDek.saltB64,
      iterations: wrappedDek.iterations || 100000,
      ivB64: wrappedDek.ivB64,
      ciphertextB64: wrappedDek.ciphertextB64,
      version: wrappedDek.version || '1'
    };
    user.vault.updatedAt = new Date();
    
    await user.save();
    
    // Log rotation
    await log('vault_rotated', {
      userId: user._id,
      details: { version: wrappedDek.version || '1' }
    });
    
    res.json({
      success: true,
      message: 'Vault DEK rotated successfully'
    });
  } catch (err) {
    console.error('Vault rotate error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
