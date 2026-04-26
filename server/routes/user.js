const express = require('express');
const { protect } = require('../middleware/auth.js');
const { ping, updateSettings, getLegacyScore } = require('../controllers/userController.js');
const { validate, updateSettingsSchema } = require('../validators');

const router = express.Router();

router.use(protect);

// Core routes
router.post('/ping', ping);
router.get('/settings', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
router.put('/settings', updateSettings);
router.get('/score', getLegacyScore);

/**
 * Stats for dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const Asset = require('../models/Asset');
    const Beneficiary = require('../models/Beneficiary');
    const Capsule = require('../models/Capsule');

    const [assetCount, beneficiaryCount, capsuleCount] = await Promise.all([
      Asset.countDocuments({ userId }),
      Beneficiary.countDocuments({ userId }),
      Capsule.countDocuments({ userId })
    ]);

    return res.json({
      status: 'success',
      data: {
        stats: {
          assets: assetCount,
          beneficiaries: beneficiaryCount,
          capsules: capsuleCount
        },
        triggerStatus: req.user.triggerStatus,
        inactivityDuration: req.user.inactivityDuration,
        lastActive: req.user.lastActive,
        isPremium: req.user.isPremium
      }
    });
  } catch (error) {
    return res.status(400).json({ status: 'fail', message: error.message });
  }
});

/**
 * Mark onboarding complete
 * NOTE: reuse updateSettingsSchema validation so inactivityDuration and alertChannels stay correct.
 * This prevents invalid values from slipping in.
 */
router.post('/onboarding-complete', validate(updateSettingsSchema), async (req, res) => {
  try {
    const { inactivityDuration, phone, alertChannels } = req.validatedBody || req.body;

    const updateData = { onboardingComplete: true };
    if (inactivityDuration !== undefined) updateData.inactivityDuration = inactivityDuration;
    if (phone !== undefined) updateData.phone = phone;
    if (alertChannels !== undefined) updateData.alertChannels = alertChannels;

    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { returnDocument: 'after' });

    return res.json({ status: 'success', data: { user } });
  } catch (error) {
    return res.status(400).json({ status: 'fail', message: error.message });
  }
});

/**
 * Gamification summary
 */
router.get('/gamification', async (req, res) => {
  try {
    const userId = req.user._id;
    const Asset = require('../models/Asset');
    const Beneficiary = require('../models/Beneficiary');
    const Capsule = require('../models/Capsule');

    const [assetCount, beneficiaryCount, capsuleCount] = await Promise.all([
      Asset.countDocuments({ userId }),
      Beneficiary.countDocuments({ userId }),
      Capsule.countDocuments({ userId })
    ]);

    let score = 0;
    score += assetCount * 10;
    score += beneficiaryCount * 25;
    score += capsuleCount * 50;
    if (beneficiaryCount >= 1) score += 50;
    if (assetCount >= 5) score += 100;
    if (capsuleCount >= 3) score += 150;

    const level = Math.max(1, Math.floor(score / 100) + 1);
    const progressToNextLevel = score % 100;

    const unlockedBadges = [
      assetCount >= 1 && 'first_asset',
      beneficiaryCount >= 1 && 'first_beneficiary',
      capsuleCount >= 1 && 'first_capsule',
      assetCount >= 5 && 'vault_master',
      score >= 500 && 'legacy_builder',
      req.user.streak >= 7 && 'week_streak',
      req.user.streak >= 30 && 'month_streak'
    ].filter(Boolean);

    return res.json({
      status: 'success',
      data: {
        score,
        level,
        progressToNextLevel,
        streak: req.user.streak || 0,
        badges: unlockedBadges,
        stats: { assets: assetCount, beneficiaries: beneficiaryCount, capsules: capsuleCount }
      }
    });
  } catch (error) {
    return res.status(400).json({ status: 'fail', message: error.message });
  }
});

/**
 * Activity feed
 */
router.get('/activity', async (req, res) => {
  try {
    const userId = req.user._id;
    const Asset = require('../models/Asset');
    const Beneficiary = require('../models/Beneficiary');
    const Capsule = require('../models/Capsule');

    const [recentAssets, recentBeneficiaries, recentCapsules] = await Promise.all([
      Asset.find({ userId }).sort({ createdAt: -1 }).limit(3).select('platform createdAt'),
      Beneficiary.find({ userId }).sort({ createdAt: -1 }).limit(3).select('name createdAt'),
      Capsule.find({ userId }).sort({ createdAt: -1 }).limit(3).select('title isReleased createdAt')
    ]);

    const activities = [
      ...recentAssets.map((a) => ({
        type: 'vault',
        title: `Vault item added: ${a.platform}`,
        timestamp: a.createdAt,
        color: 'blue'
      })),
      ...recentBeneficiaries.map((b) => ({
        type: 'beneficiary',
        title: `Beneficiary added: ${b.name}`,
        timestamp: b.createdAt,
        color: 'green'
      })),
      ...recentCapsules.map((c) => ({
        type: 'capsule',
        title: c.isReleased ? `Time letter delivered: ${c.title}` : `Time letter created: ${c.title}`,
        timestamp: c.createdAt,
        color: 'purple'
      }))
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);

    return res.json({ status: 'success', data: activities });
  } catch (error) {
    return res.status(400).json({ status: 'fail', message: error.message });
  }
});

/**
 * Activity logs (AuditLog)
 */
router.get('/logs', async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const userId = req.user._id;

    const logs = await AuditLog
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    // Transform to match client expectations
    const transformedLogs = logs.map(log => ({
      _id: log._id,
      event: (log.action || 'unknown').toLowerCase().replace(/_/g, '_'),
      severity: log.riskLevel || 'info',
      timestamp: log.timestamp || log.createdAt,
      ip: log.ipAddress || 'unknown',
      details: log.metadata || log.details
    }));

    return res.status(200).json({
      status: 'success',
      data: transformedLogs
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Set recovery passphrase
 * Stored as bcrypt hash via User model pre-save hook (never stored plaintext).
 */
router.put('/recovery-passphrase', async (req, res) => {
  try {
    const { passphrase } = req.body;

    if (!passphrase || passphrase.length < 12) {
      return res
        .status(400)
        .json({ success: false, message: 'Passphrase must be at least 12 characters' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('+recoveryPassphraseHash');

    user.recoveryPassphraseHash = passphrase; // will be hashed in pre-save hook
    user.recoveryPassphraseSet = true;
    await user.save();

    return res.json({ success: true, message: 'Recovery passphrase saved' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;