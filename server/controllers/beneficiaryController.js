const Beneficiary = require('../models/Beneficiary');

// Get all beneficiaries for user
exports.getAllBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({ userId: req.user._id });
    res.status(200).json({
      status: 'success',
      results: beneficiaries.length,
      data: { beneficiaries }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Create beneficiary
exports.createBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.create({ ...req.body, userId: req.user._id });
    res.status(201).json({
      status: 'success',
      data: { beneficiary }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update beneficiary
exports.updateBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!beneficiary || beneficiary.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        status: 'fail',
        message: 'Beneficiary not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { beneficiary }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Delete beneficiary
exports.deleteBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findByIdAndDelete(req.params.id);
    
    if (!beneficiary || beneficiary.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        status: 'fail',
        message: 'Beneficiary not found'
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
