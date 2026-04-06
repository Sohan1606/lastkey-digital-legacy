const express = require('express');
const { protect } = require('../middleware/auth');
const { generateLegacyMessage, getAISuggestions } = require('../controllers/aiController');

const router = express.Router();

router.post('/generate-message', protect, generateLegacyMessage);
router.get('/suggestions', protect, getAISuggestions);

module.exports = router;

