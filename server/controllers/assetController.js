const Asset = require('../models/Asset');

exports.createAsset = async (req, res, next) => {
  try {
    const assetData = {
      ...req.body,
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

    // Decrypt passwords
    const assetsWithDecryptedPassword = assets.map(asset => ({
      ...asset._doc,
      password: asset.decryptPassword()
    }));

    res.status(200).json({
      status: 'success',
      results: assets.length,
      data: assetsWithDecryptedPassword
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
    const asset = await Asset.findOne({ _id: req.params.id, userId: req.user._id });

    if (!asset) {
      return res.status(404).json({
        status: 'fail',
        message: 'Asset not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      asset[key] = req.body[key];
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
