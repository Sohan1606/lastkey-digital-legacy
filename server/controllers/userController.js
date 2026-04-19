const User = require('../models/User');
const Asset = require('../models/Asset');

// Lazy-load to avoid crash when Redis/BullMQ not configured
let _guardianScheduler = null;
const getScheduler = () => {
  if (!_guardianScheduler) {
    try {
      _guardianScheduler = require('../services/guardianScheduler');
    } catch {
      _guardianScheduler = null;
    }
  }
  return _guardianScheduler;
};

// Ping - update lastActive
exports.ping = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { lastActive: new Date(), triggerStatus: 'active', warningEmailSent: false },
      { new: true }
    );

    // Cancel old jobs and schedule new ones from now
    try {
      const s = getScheduler();
      if (s) {
        await s.cancelGuardianJobs(user._id.toString());
        await s.scheduleGuardianJobs(user);
      }
    } catch (schedErr) {
      console.warn('Scheduler non-fatal error:', schedErr?.message || schedErr);
    }

    // Emit status update to user
    global.io.to(user._id.toString()).emit('dms-update', {
      userId: user._id.toString(),
      status: user.triggerStatus,
      remainingMinutes: user.inactivityDuration,
      message: 'Active & Secure',
      inactiveMinutes: 0,
      inactivityDuration: user.inactivityDuration
    });

    res.status(200).json({
      status: 'success',
      message: 'Ping received',
      user: {
        name: user.name,
        triggerStatus: user.triggerStatus,
        inactivityDuration: user.inactivityDuration
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update settings
exports.updateSettings = async (req, res, next) => {
  try {
    const { inactivityDuration, phone, alertChannels } = req.body;
    const updateData = {};
    if (inactivityDuration != null) updateData.inactivityDuration = inactivityDuration;
    if (phone !== undefined) updateData.phone = phone;
    if (alertChannels) updateData.alertChannels = alertChannels;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        inactivityDuration: user.inactivityDuration,
        phone: user.phone,
        alertChannels: user.alertChannels,
        triggerStatus: user.triggerStatus
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get legacy score (updated weights)
exports.getLegacyScore = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Count assets
    const assetCount = await Asset.countDocuments({ userId });
    
    // Count beneficiaries
    const Beneficiary = require('../models/Beneficiary');
    const beneficiaryCount = await Beneficiary.countDocuments({ userId });
    
    // Count capsules
    const Capsule = require('../models/Capsule');
    const capsuleCount = await Capsule.countDocuments({ userId });
    
    // Calculate score with new weights
    const assetsScore = Math.min(assetCount * 8, 40); // 40% max
    const contactsScore = Math.min(beneficiaryCount * 10, 30); // 30% max
    const capsulesScore = Math.min(capsuleCount * 15, 30); // 30% max
    
    const totalScore = Math.round(assetsScore + contactsScore + capsulesScore);
    
    let message = '';
    if (totalScore < 30) {
      message = 'Low: Add assets, beneficiaries and capsules';
    } else if (totalScore < 70) {
      message = 'Medium: Add more contacts and time capsules';
    } else {
      message = 'Premium: Excellent preparation! 🎉';
    }

    res.status(200).json({
      status: 'success',
      data: {
        score: totalScore,
        breakdown: {
          assets: assetsScore,
          contacts: contactsScore,
          capsules: capsulesScore
        },
        message,
        stats: {
          assets: assetCount,
          beneficiaries: beneficiaryCount,
          capsules: capsuleCount
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};
