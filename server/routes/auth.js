const express = require('express');
const { register, login, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Auth rate limiting
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many auth attempts, please try again later.'
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/protected', protect, (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

module.exports = router;
