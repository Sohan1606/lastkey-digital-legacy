const User = require('../models/User');
const Asset = require('../models/Asset');

// Lazy-load scheduler to avoid crash when Redis/BullMQ not configured
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

const isDevFastMode = () => {
  return (
    process.env.NODE_ENV !== 'production' &&
    (process.env.DEV_FAST_MODE === 'true' || process.env.DEV_FAST_MODE === '1')
  );
};

// Ping - update lastActive
exports.ping = async (req, res) => {
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

    // Emit status update to user room
    const fastMode = isDevFastMode();
    const unit = fastMode ? 'minutes' : 'days';

    global.io.to(`user:${user._id.toString()}`).emit('dms-update', {
      userId: user._id.toString(),
      status: user.triggerStatus,
      unit,
      inactive: 0,
      threshold: user.inactivityDuration,

      // Backward-compatible fields for existing UI
      remainingMinutes: user.inactivityDuration,
      inactiveMinutes: 0,
      inactivityDuration: user.inactivityDuration,

      message: 'Active & Secure'
    });

    return res.status(200).json({
      status: 'success',
      message: 'Ping received',
      user: {
        name: user.name,
        triggerStatus: user.triggerStatus,
        inactivityDuration: user.inactivityDuration,
        inactivityUnit: unit
      }
    });
  } catch (error) {
    return res.status(400).json({ status: 'fail', message: error.message });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const { inactivityDuration, phone, alertChannels } = req.body;
    const updateData = {};

    if (phone !== undefined) updateData.phone = phone;
    if (alertChannels) updateData.alertChannels = alertChannels;

    // Sudden Death Mitigation:
    // In real mode (days), block "short inactivity" unless at least one enrolled beneficiary exists.
    // In DEV_FAST_MODE (minutes), do NOT block (otherwise it ruins demos).
    const fastMode = isDevFastMode();

    if (inactivityDuration != null) {
      const Beneficiary = require('../models/Beneficiary');
      const enrolledCount = await Beneficiary.countDocuments({
        userId: req.user._id,
        enrollmentStatus: 'enrolled'
      });

      if (!fastMode) {
        // 30 days rule in real mode
        if (inactivityDuration < 30 && enrolledCount === 0) {
          return res.status(400).json({
            status: 'fail',
            message:
              'Cannot enable a short inactivity period without at least one enrolled beneficiary. ' +
              'Invite and enroll a beneficiary first to prevent sudden-death lockout.'
          });
        }
      }

      updateData.inactivityDuration = inactivityDuration;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      status: 'success',
      data: {
        inactivityDuration: user.inactivityDuration,
        inactivityUnit: fastMode ? 'minutes' : 'days',
        phone: user.phone,
        alertChannels: user.alertChannels,
        triggerStatus: user.triggerStatus,
        ...(fastMode && {
          warning:
            'DEV_FAST_MODE is enabled: inactivityDuration is treated as minutes for testing.'
        })
      }
    });
  } catch (error) {
    return res.status(400).json({ status: 'fail', message: error.message });
  }
};

// Get legacy score (updated weights)
exports.getLegacyScore = async (req, res) => {
  try {
    const userId = req.user._id;

    const assetCount = await Asset.countDocuments({ userId });

    const Beneficiary = require('../models/Beneficiary');
    const beneficiaryCount = await Beneficiary.countDocuments({ userId });

    const Capsule = require('../models/Capsule');
    const capsuleCount = await Capsule.countDocuments({ userId });

    // Score weights (max 100)
    const assetsScore = Math.min(assetCount * 8, 40);
    const contactsScore = Math.min(beneficiaryCount * 10, 30);
    const capsulesScore = Math.min(capsuleCount * 15, 30);

    const totalScore = Math.round(assetsScore + contactsScore + capsulesScore);

    let message = '';
    if (totalScore < 30) message = 'Low: Add assets, beneficiaries, and capsules';
    else if (totalScore < 70) message = 'Medium: Add more beneficiaries and time capsules';
    else message = 'Excellent: Your legacy plan is well prepared';

    return res.status(200).json({
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
    return res.status(400).json({ status: 'fail', message: error.message });
  }
};