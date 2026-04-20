const express = require('express');
const { protect } = require('../middleware/auth');
const { generateLegacyMessage, getAISuggestions, getLegacyScoreData, generateVoiceMessage, generateMemoir } = require('../controllers/aiController');

const router = express.Router();

// Feature flag check middleware
const checkAIFeature = (req, res, next) => {
  if (process.env.FEATURE_AI === 'false') {
    return res.status(501).json({
      success: false,
      message: 'AI features are disabled in FREE_MODE',
      demo: true,
      data: {
        message: 'This is a demo response. AI features require OpenAI API key.',
        suggestions: ['Write a personal message', 'Include specific memories', 'Express gratitude'],
        score: 75
      }
    });
  }
  next();
};

router.post('/generate-message', protect, checkAIFeature, generateLegacyMessage);
router.post('/generate-voice', protect, checkAIFeature, generateVoiceMessage);
router.post('/generate-memoir', protect, checkAIFeature, generateMemoir);
router.get('/suggestions', protect, checkAIFeature, getAISuggestions);
router.get('/legacy-score', protect, checkAIFeature, getLegacyScoreData);

module.exports = router;

