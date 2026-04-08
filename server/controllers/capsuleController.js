const Capsule = require('../models/Capsule');

// Get user's capsules
exports.getMyCapsules = async (req, res) => {
  try {
    const capsules = await Capsule.find({ userId: req.user._id }).sort({ unlockAt: 1 });
    res.status(200).json({
      status: 'success',
      results: capsules.length,
      data: { capsules }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Create capsule
exports.createCapsule = async (req, res) => {
  try {
    const capsule = await Capsule.create({ ...req.body, userId: req.user._id });
    res.status(201).json({
      status: 'success',
      data: { capsule }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update capsule
exports.updateCapsule = async (req, res) => {
  try {
    const capsule = await Capsule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!capsule) {
      return res.status(404).json({
        status: 'fail',
        message: 'Capsule not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { capsule }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Delete capsule
exports.deleteCapsule = async (req, res) => {
  try {
    const capsule = await Capsule.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!capsule) {
      return res.status(404).json({
        status: 'fail',
        message: 'Capsule not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};
