const express = require('express');
const { register, login, verifyEmail, forgotPassword, resetPassword, checkIn } = require('../controllers/authController');
const User = require('../models/User');
const { protect, blacklistToken } = require('../middleware/auth');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators');
const { sendWelcomeEmail, sendInactivityWarningEmail, sendTriggerActivationEmail } = require('../services/emailService');

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

/**
 * POST /send-demo-email
 * Demo endpoint to send test emails for development
 */
router.post('/send-demo-email', protect, async (req, res) => {
  try {
    const { emailType } = req.body;

    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user._id).select('name email');

    if (emailType === 'welcome') {
      const Beneficiary = (await import('../models/Beneficiary.js')).default;
      const beneficiaries = await Beneficiary.find({
        userId: req.user._id
      });

      const sendTo = beneficiaries.length > 0
        ? beneficiaries[0].email
        : user.email;

      await sendWelcomeEmail(sendTo, user.name);
      return res.status(200).json({
        status: 'success',
        message: `Welcome email sent to ${sendTo}`
      });
    }

    if (emailType === 'checkin-warning') {
      const Beneficiary = (await import('../models/Beneficiary.js')).default;
      const beneficiaries = await Beneficiary.find({
        userId: req.user._id
      });

      const sendTo = beneficiaries.length > 0
        ? beneficiaries[0].email
        : user.email;

      await sendInactivityWarningEmail(
        sendTo,
        user.name,
        7,
        `${process.env.CLIENT_URL}/dashboard`
      );
      return res.status(200).json({
        status: 'success',
        message: `Inactivity warning sent to ${sendTo}`
      });
    }

    if (emailType === 'trigger-activation') {
      const Beneficiary = (await import('../models/Beneficiary.js')).default;
      const BeneficiaryAccess = (await import('../models/BeneficiaryAccess.js')).default;
      const crypto = await import('crypto');

      const userId = req.user._id || req.user.id;

      const beneficiaries = await Beneficiary.find({
        userId: userId
      });

      if (beneficiaries.length === 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please add a beneficiary first in the Beneficiaries section'
        });
      }

      const sentTo = [];

      for (const beneficiary of beneficiaries) {
        try {
          // Generate real cryptographic token
          const portalToken = crypto.default.randomBytes(32).toString('hex');

          // Delete existing access for this beneficiary
          const deleted = await BeneficiaryAccess.deleteMany({
            beneficiaryId: beneficiary._id,
            ownerId: req.user._id
          });

          // Create real access record in database
          const Asset = require('../models/Asset');
          let assignedItems = [];

          if (beneficiary.accessLevel === 'custom') {
            // Use only assigned vault items
            assignedItems = beneficiary.assignedVaultItems || [];
          } else if (beneficiary.accessLevel === 'full') {
            // Get all vault items for this user
            const allAssets = await Asset.find({ ownerId: req.user._id });
            assignedItems = allAssets.map(a => a._id);
          } else {
            // View level - get all items but mark as view-only
            const allAssets = await Asset.find({ ownerId: req.user._id });
            assignedItems = allAssets.map(a => a._id);
          }

          const newAccess = await BeneficiaryAccess.create({
            token: portalToken,
            beneficiaryId: beneficiary._id,
            ownerId: req.user._id,
            assignedItems,
            accessLevel: beneficiary.accessLevel || 'view',
            accessOptions: beneficiary.accessOptions || {},
            verificationQuestion: beneficiary.verificationQuestion || '',
            verificationAnswerHash: beneficiary.verificationAnswerHash || '',
            verificationHint: beneficiary.verificationHint || '',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isRevoked: false,
            isVerified: false
          });

          const portalUrl = `${process.env.CLIENT_URL}/portal/${portalToken}`;

          await sendTriggerActivationEmail(
            beneficiary.email,
            beneficiary.name,
            user.name,
            portalUrl
          );

          sentTo.push(beneficiary.name);
        } catch (createError) {
          // Silently log error for debugging
        }
      }

      return res.status(200).json({
        status: 'success',
        message: `Legacy activation email sent to: ${sentTo.join(', ')}`
      });
    }

    return res.status(400).json({
      status: 'fail',
      message: 'Invalid email type. Use: welcome, checkin-warning, trigger-activation'
    });

  } catch (error) {
    console.error('Demo email error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
