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
    const { verificationQuestion, verificationAnswer, ...rest } = req.body;
    
    // Create beneficiary without verificationAnswer (we'll hash it separately)
    const beneficiary = new Beneficiary({ ...rest, userId: req.user._id });
    
    // SECURITY LAYER 1: Set verification question and hash answer
    if (verificationQuestion && verificationAnswer) {
      beneficiary.verificationQuestion = verificationQuestion;
      await beneficiary.setVerificationAnswer(verificationAnswer);
    }
    
    await beneficiary.save();
    
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
    const { verificationQuestion, verificationAnswer, verificationHint, ...rest } = req.body;
    
    const beneficiary = await Beneficiary.findById(req.params.id);
    
    if (!beneficiary || beneficiary.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        status: 'fail',
        message: 'Beneficiary not found'
      });
    }
    
    // Update basic fields
    Object.assign(beneficiary, rest);
    
    // Update verification question and hint
    if (verificationQuestion !== undefined) {
      beneficiary.verificationQuestion = verificationQuestion;
    }
    if (verificationHint !== undefined) {
      beneficiary.verificationHint = verificationHint;
    }
    
    // Hash new verification answer if provided
    if (verificationAnswer) {
      await beneficiary.setVerificationAnswer(verificationAnswer);
    }
    
    await beneficiary.save();
    
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
