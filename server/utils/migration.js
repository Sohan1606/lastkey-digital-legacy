/**
 * Migration utility for legacy server-encrypted assets
 * 
 * This module provides functions to migrate assets that were encrypted
 * using the old server-side CryptoJS encryption to the new client-side
 * encryption model.
 * 
 * Migration process:
 * 1. Decrypt legacy assets using the old server-side key
 * 2. Notify owner to re-encrypt with client-side encryption
 * 3. Mark assets as migrated
 */

const CryptoJS = require('crypto-js');
const Asset = require('../models/Asset');
const { log } = require('../services/auditService');

const LEGACY_ENCRYPTION_KEY = process.env.LEGACY_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;

/**
 * Check if an asset uses legacy server-side encryption
 * @param {Object} asset - Asset document
 * @returns {boolean}
 */
const isLegacyEncrypted = (asset) => {
  // Legacy assets have encryptedData field and no clientEncryption flag
  return asset.encryptedData && !asset.clientEncryption;
};

/**
 * Decrypt legacy server-side encrypted data
 * @param {string} encryptedData - Base64 encrypted string
 * @returns {Object|null} Decrypted data or null if failed
 */
const decryptLegacyAsset = (encryptedData) => {
  try {
    if (!LEGACY_ENCRYPTION_KEY) {
      throw new Error('Legacy encryption key not configured');
    }

    const bytes = CryptoJS.AES.decrypt(encryptedData, LEGACY_ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Decryption resulted in empty string');
    }

    return JSON.parse(decryptedString);
  } catch (err) {
    console.error('Legacy decryption failed:', err.message);
    return null;
  }
};

/**
 * Get all legacy encrypted assets for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of legacy assets
 */
const getLegacyAssets = async (userId) => {
  try {
    const assets = await Asset.find({ 
      userId,
      encryptedData: { $exists: true, $ne: null },
      clientEncryption: { $ne: true }
    });

    return assets;
  } catch (err) {
    console.error('Failed to get legacy assets:', err.message);
    return [];
  }
};

/**
 * Mark an asset as requiring client-side re-encryption
 * @param {string} assetId - Asset ID
 * @returns {Promise<boolean>}
 */
const markForReencryption = async (assetId) => {
  try {
    await Asset.findByIdAndUpdate(assetId, {
      $set: {
        requiresReencryption: true,
        reencryptionNotifiedAt: new Date()
      }
    });

    return true;
  } catch (err) {
    console.error('Failed to mark asset for re-encryption:', err.message);
    return false;
  }
};

/**
 * Migrate a single legacy asset
 * @param {string} assetId - Asset ID
 * @returns {Promise<{success: boolean, message: string, data?: Object}>}
 */
const migrateAsset = async (assetId) => {
  try {
    const asset = await Asset.findById(assetId);
    
    if (!asset) {
      return { success: false, message: 'Asset not found' };
    }

    if (!isLegacyEncrypted(asset)) {
      return { success: false, message: 'Asset is not legacy encrypted' };
    }

    // Decrypt the legacy data
    const decryptedData = decryptLegacyAsset(asset.encryptedData);
    
    if (!decryptedData) {
      return { success: false, message: 'Failed to decrypt legacy asset' };
    }

    // Store decrypted data temporarily (will be re-encrypted client-side)
    await Asset.findByIdAndUpdate(assetId, {
      $set: {
        decryptedData, // Temporary storage for client-side re-encryption
        requiresReencryption: true,
        legacyMigratedAt: new Date()
      }
    });

    // Log migration
    await log('legacy_asset_migrated', {
      userId: asset.userId,
      details: { assetId: asset._id, type: asset.type }
    });

    return {
      success: true,
      message: 'Asset prepared for client-side re-encryption',
      data: {
        assetId: asset._id,
        type: asset.type,
        decryptedData // Sent to client for re-encryption
      }
    };
  } catch (err) {
    console.error('Asset migration failed:', err.message);
    return { success: false, message: err.message };
  }
};

/**
 * Complete migration after client-side re-encryption
 * @param {string} assetId - Asset ID
 * @param {Object} clientEncryptedData - New client-encrypted data
 * @returns {Promise<{success: boolean, message: string}>}
 */
const completeMigration = async (assetId, clientEncryptedData) => {
  try {
    const asset = await Asset.findById(assetId);
    
    if (!asset) {
      return { success: false, message: 'Asset not found' };
    }

    // Update with client-encrypted data
    await Asset.findByIdAndUpdate(assetId, {
      $set: {
        encryptedData: clientEncryptedData,
        clientEncryption: true,
        requiresReencryption: false,
        reencryptedAt: new Date()
      },
      $unset: {
        decryptedData: 1, // Remove temporary decrypted data
        legacyMigratedAt: 1
      }
    });

    // Log completion
    await log('legacy_asset_reencrypted', {
      userId: asset.userId,
      details: { assetId: asset._id }
    });

    return { success: true, message: 'Migration completed successfully' };
  } catch (err) {
    console.error('Migration completion failed:', err.message);
    return { success: false, message: err.message };
  }
};

/**
 * Get migration status for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Migration status
 */
const getMigrationStatus = async (userId) => {
  try {
    const legacyAssets = await Asset.find({
      userId,
      encryptedData: { $exists: true, $ne: null },
      clientEncryption: { $ne: true }
    });

    const pendingReencryption = await Asset.find({
      userId,
      requiresReencryption: true
    });

    const migratedAssets = await Asset.find({
      userId,
      clientEncryption: true,
      reencryptedAt: { $exists: true }
    });

    return {
      totalLegacyAssets: legacyAssets.length,
      pendingReencryption: pendingReencryption.length,
      migratedAssets: migratedAssets.length,
      needsMigration: legacyAssets.length > 0
    };
  } catch (err) {
    console.error('Failed to get migration status:', err.message);
    return {
      totalLegacyAssets: 0,
      pendingReencryption: 0,
      migratedAssets: 0,
      needsMigration: false,
      error: err.message
    };
  }
};

/**
 * Batch migrate all legacy assets for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: number, failed: number, assets: Array}>}
 */
const batchMigrateUserAssets = async (userId) => {
  try {
    const legacyAssets = await getLegacyAssets(userId);
    const results = {
      success: 0,
      failed: 0,
      assets: []
    };

    for (const asset of legacyAssets) {
      const result = await migrateAsset(asset._id);
      if (result.success) {
        results.success++;
        results.assets.push({
          assetId: asset._id,
          type: asset.type,
          decryptedData: result.data.decryptedData
        });
      } else {
        results.failed++;
        results.assets.push({
          assetId: asset._id,
          type: asset.type,
          error: result.message
        });
      }
    }

    // Log batch migration
    await log('legacy_batch_migration', {
      userId,
      details: { success: results.success, failed: results.failed }
    });

    return results;
  } catch (err) {
    console.error('Batch migration failed:', err.message);
    return { success: 0, failed: 0, assets: [], error: err.message };
  }
};

module.exports = {
  isLegacyEncrypted,
  decryptLegacyAsset,
  getLegacyAssets,
  markForReencryption,
  migrateAsset,
  completeMigration,
  getMigrationStatus,
  batchMigrateUserAssets
};
