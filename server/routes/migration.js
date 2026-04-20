const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getMigrationStatus,
  batchMigrateUserAssets,
  migrateAsset,
  completeMigration
} = require('../utils/migration');
const { log } = require('../services/auditService');

const router = express.Router();

// Get migration status for current user
router.get('/status', protect, async (req, res) => {
  try {
    const status = await getMigrationStatus(req.user._id);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (err) {
    console.error('Migration status error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get migration status'
    });
  }
});

// Start batch migration for current user
router.post('/start', protect, async (req, res) => {
  try {
    const results = await batchMigrateUserAssets(req.user._id);
    
    res.status(200).json({
      success: true,
      message: `Migration started. ${results.success} assets ready for re-encryption.`,
      data: results
    });
  } catch (err) {
    console.error('Migration start error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to start migration'
    });
  }
});

// Migrate a specific asset
router.post('/asset/:assetId', protect, async (req, res) => {
  try {
    const { assetId } = req.params;
    const result = await migrateAsset(assetId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('Asset migration error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to migrate asset'
    });
  }
});

// Complete migration after client-side re-encryption
router.post('/complete/:assetId', protect, async (req, res) => {
  try {
    const { assetId } = req.params;
    const { encryptedData } = req.body;

    if (!encryptedData) {
      return res.status(400).json({
        success: false,
        message: 'Encrypted data is required'
      });
    }

    const result = await completeMigration(assetId, encryptedData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('Migration completion error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to complete migration'
    });
  }
});

// Skip migration for an asset (mark as manually handled)
router.post('/skip/:assetId', protect, async (req, res) => {
  try {
    const { assetId } = req.params;
    const { reason } = req.body;

    const Asset = require('../models/Asset');
    await Asset.findByIdAndUpdate(assetId, {
      $set: {
        migrationSkipped: true,
        migrationSkippedAt: new Date(),
        migrationSkipReason: reason || 'User skipped'
      }
    });

    await log('migration_skipped', {
      userId: req.user._id,
      details: { assetId, reason }
    });

    res.status(200).json({
      success: true,
      message: 'Migration skipped for this asset'
    });
  } catch (err) {
    console.error('Migration skip error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to skip migration'
    });
  }
});

module.exports = router;
