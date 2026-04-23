const Asset = require('../models/Asset');
const { log } = require('../services/auditService');

// NOTE: Client-side encryption - server does not validate ciphertext format

// NOTE: Server-side decryption removed (P2)
// Passwords are client-encrypted; server never sees plaintext

exports.createAsset = async (req, res, next) => {
  try {
    const validatedBody = req.validatedBody || req.body;
    
    // NOTE: Client-side encryption - server does not validate ciphertext format
    // Server only stores what client sends (encrypted or plaintext based on client state)

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
    await log('VAULT_ITEM_VIEWED', {
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
    
    // NOTE: Client-side encryption - server does not validate ciphertext format
    // Server only stores what client sends (encrypted or plaintext based on client state)

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
