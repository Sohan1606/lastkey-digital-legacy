const express = require('express');
const { protect } = require('../middleware/auth');
const { generateLegacyMessage, getAISuggestions, getLegacyScoreData, generateVoiceMessage, generateMemoir } = require('../controllers/aiController');

const router = express.Router();

router.post('/generate-message', protect, generateLegacyMessage);
router.post('/generate-voice', protect, generateVoiceMessage);
router.post('/generate-memoir', protect, generateMemoir);
router.get('/suggestions', protect, getAISuggestions);
router.get('/legacy-score', protect, getLegacyScoreData);

module.exports = router;

