const Asset = require('../models/Asset');
const { log } = require('../services/auditService');

// Ciphertext validation helper
const isCiphertext = (str) => {
  if (typeof str !== 'string' || str.length < 50) return false;
  // Base64-like chars (allow padding)
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
};

// NOTE: Server-side decryption removed (P2)
// Passwords are client-encrypted; server never sees plaintext

exports.createAsset = async (req, res, next) => {
  try {
    const validatedBody = req.validatedBody || req.body;
    
    // Server safety net: enforce ciphertext-only for passwords
    if (validatedBody.password) {
      if (validatedBody.clientEncrypted !== true) {
        return res.status(400).json({
          status: 'fail',
          message: 'Password must be client-encrypted (clientEncrypted: true)'
        });
      }
      if (!isCiphertext(validatedBody.password)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid password ciphertext format (must be base64-encoded, min length 50)'
        });
      }
    }

    const assetData = {
      ...validatedBody,
      userId: req.user._id
    };

    const newAsset = await Asset.create(assetData);

    res.status(201).json({
      status: 'success',
      data: newAsset
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.getAssets = async (req, res, next) => {
  try {
    const assets = await Asset.find({ userId: req.user._id });

    // Log vault access
    await log('vault_access', { 
      userId: req.user._id, 
      ip: req.ip, 
      details: { count: assets.length } 
    });

    // Return assets with encrypted passwords (client will decrypt)
    // Server never decrypts - we only store ciphertext
    const assetsWithEncryptedPassword = assets.map(asset => {
      const assetObj = asset.toObject();
      // Always return encrypted password (or placeholder if not encrypted)
      if (!assetObj.clientEncrypted) {
        // Legacy asset without client encryption - mark for migration
        assetObj.password = '[MIGRATION_REQUIRED]';
        assetObj.needsMigration = true;
      }
      return assetObj;
    });

    res.status(200).json({
      status: 'success',
      results: assets.length,
      data: assetsWithEncryptedPassword
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.updateAsset = async (req, res, next) => {
  try {
    const validatedBody = req.validatedBody || req.body;
    
    // Server safety net: enforce ciphertext-only for passwords
    if (validatedBody.password) {
      if (validatedBody.clientEncrypted !== true) {
        return res.status(400).json({
          status: 'fail',
          message: 'Password must be client-encrypted (clientEncrypted: true)'
        });
      }
      if (!isCiphertext(validatedBody.password)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid password ciphertext format (must be base64-encoded, min length 50)'
        });
      }
    }

    const asset = await Asset.findOne({ _id: req.params.id, userId: req.user._id });

    if (!asset) {
      return res.status(404).json({
        status: 'fail',
        message: 'Asset not found'
      });
    }

    // Update fields from validated body
    Object.keys(validatedBody).forEach(key => {
      asset[key] = validatedBody[key];
    });

    await asset.save();

    res.status(200).json({
      status: 'success',
      data: asset
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!asset) {
      return res.status(404).json({
        status: 'fail',
        message: 'Asset not found'
      });
    }

    res.status(204).json({
      status: 'success',
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};
