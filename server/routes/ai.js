const express = require('express');
const { protect } = require('../middleware/auth');
const { generateLegacyMessage, getAISuggestions, getLegacyScoreData, generateVoiceMessage, generateMemoir, handleChat } = require('../controllers/aiController');

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
router.get('/suggestions', protect, getAISuggestions);
router.get('/legacy-score', protect, getLegacyScoreData);
router.post('/chat', protect, handleChat);

// Grammar improvement (simple, no OpenAI required)
router.post('/improve-grammar', protect, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Text is required'
      });
    }
    
    let improved = text;
    
    // Capitalize first letter of sentences
    improved = improved.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    // Fix double spaces
    improved = improved.replace(/\s{2,}/g, ' ');
    
    // Fix spacing after punctuation
    improved = improved.replace(/([.!?,;:])([^\s])/g, '$1 $2');
    
    // Fix "i" to "I"
    improved = improved.replace(/\bi\b/g, 'I');
    
    return res.status(200).json({
      status: 'success',
      data: {
        original: text,
        improved,
        changes: improved !== text ? 'Grammar and formatting improved' : 'Text looks good already'
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;

