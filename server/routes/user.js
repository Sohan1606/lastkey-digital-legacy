const express = require('express');
const { protect } = require('../middleware/auth.js');
const { ping, updateSettings, getLegacyScore } = require('../controllers/userController.js');

const router = express.Router();

router.use(protect);

router.post('/ping', ping);
router.put('/settings', updateSettings);
router.get('/score', require('../controllers/userController').getLegacyScore);

module.exports = router;
