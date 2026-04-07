const express = require('express');
const { protect } = require('../middleware/auth.js');
const { ping, updateSettings, getLegacyScore } = require('../controllers/userController.js');

const router = express.Router();

router.use(protect);

router.post('/ping', ping);
router.put('/settings', updateSettings);

router.post('/onboarding-complete', async (req, res) => {
  try {
    const { inactivityDuration, phone, alertChannels } = req.body;
    const updateData = { onboardingComplete: true };
    if (inactivityDuration) updateData.inactivityDuration = inactivityDuration;
    if (phone) updateData.phone = phone;
    if (alertChannels) updateData.alertChannels = alertChannels;
    
    const user = await require('../models/User').findByIdAndUpdate(
      req.user._id, updateData, { new: true }
    );
    res.json({ status: 'success', data: { user } });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
});

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
      req.user.streak >= 30 && 'month_streak',
    ].filter(Boolean);

    res.json({
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
    res.status(400).json({ status: 'fail', message: error.message });
  }
});

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
      ...recentAssets.map(a => ({ type: 'vault', title: `Vault item added: ${a.platform}`, timestamp: a.createdAt, color: 'blue' })),
      ...recentBeneficiaries.map(b => ({ type: 'beneficiary', title: `Loved one added: ${b.name}`, timestamp: b.createdAt, color: 'green' })),
      ...recentCapsules.map(c => ({ type: 'capsule', title: c.isReleased ? `Time letter delivered: ${c.title}` : `Time letter created: ${c.title}`, timestamp: c.createdAt, color: 'purple' })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);

    res.json({ status: 'success', data: activities });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
});

router.get('/score', require('../controllers/userController').getLegacyScore);

module.exports = router;
