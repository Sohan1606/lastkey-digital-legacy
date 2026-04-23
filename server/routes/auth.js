const express = require('express');
const { register, login, verifyEmail, forgotPassword, resetPassword, checkIn } = require('../controllers/authController');
const User = require('../models/User');
const { protect, blacklistToken } = require('../middleware/auth');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators');

const router = express.Router();

// Auth rate limiting
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many auth attempts, please try again later.'
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', protect, (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      blacklistToken(token);
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/check-in', protect, checkIn);
router.post('/verify-password', protect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ valid: false });
    const user = await User.findById(req.user._id).select('+password');
    const isValid = await user.comparePassword(password);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ valid: false, message: error.message });
  }
});
router.get('/protected', protect, (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

module.exports = router;
