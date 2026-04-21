const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const Beneficiary = require('../models/Beneficiary');
const User = require('../models/User');
const EmergencyAccessGrant = require('../models/EmergencyAccessGrant');
const EmergencySession = require('../models/EmergencySession');
const { log } = require('../services/auditService');
const { sendEmail } = require('../utils/email');
const { validate, beneficiaryCheckStatusSchema, beneficiaryEnrollSchema, beneficiaryLoginSchema, requestAccessSchema } = require('../validators');

const router = express.Router();

// Rate limiting for beneficiary auth endpoints
const beneficiaryAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// JWT secret for beneficiary tokens (can be same or different from owner)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');

const signToken = (id, type = 'beneficiary') => jwt.sign({ id, type }, JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '24h'
});

// Middleware to protect beneficiary routes
exports.protectBeneficiary = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify this is a beneficiary token
    if (decoded.type !== 'beneficiary') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    // Find beneficiary
    const beneficiary = await Beneficiary.findById(decoded.id);
    if (!beneficiary) {
      return res.status(401).json({ success: false, message: 'Beneficiary not found' });
    }

    // Check if owner is triggered
    const owner = await User.findById(beneficiary.userId).select('triggerStatus name');
    if (!owner) {
      return res.status(401).json({ success: false, message: 'Owner not found' });
    }

    req.beneficiary = beneficiary;
    req.owner = owner;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

// Check beneficiary enrollment status by email
router.post('/check-status', validate(beneficiaryCheckStatusSchema), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const beneficiary = await Beneficiary.findOne({ email }).populate('userId', 'name triggerStatus');
    
    if (!beneficiary) {
      // Don't reveal if email exists or not
      return res.status(200).json({ 
        success: true, 
        data: { status: 'not_found' }
      });
    }

    // Check if owner is triggered
    const ownerTriggered = beneficiary.userId?.triggerStatus === 'triggered';

    res.status(200).json({
      success: true,
      data: {
        status: beneficiary.enrollmentStatus,
        ownerName: beneficiary.userId?.name,
        ownerTriggered,
        hasPasskey: beneficiary.webauthnCredentials?.length > 0,
        hasUnlockSecret: !!beneficiary.unlockSecretHash
      }
    });
  } catch (err) {
    console.error('Check status error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Beneficiary enrollment (set unlock secret + encryption keys) - REQUIRES AUTHENTICATION
router.post('/enroll', exports.protectBeneficiary, async (req, res) => {
  try {
    const { unlockSecret, publicKeyJwk, encryptedPrivateKeyBlob } = req.body;
    const beneficiary = req.beneficiary;
    
    if (!unlockSecret) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unlock secret is required' 
      });
    }

    // Validate unlock secret strength
    if (unlockSecret.length < 12) {
      return res.status(400).json({
        success: false,
        message: 'Unlock secret must be at least 12 characters'
      });
    }

    if (beneficiary.enrollmentStatus !== 'invited') {
      return res.status(400).json({ 
        success: false, 
        message: 'Beneficiary already enrolled' 
      });
    }

    // Validate encryption key material
    if (!publicKeyJwk || !encryptedPrivateKeyBlob) {
      return res.status(400).json({
        success: false,
        message: 'Encryption key material is required (publicKeyJwk, encryptedPrivateKeyBlob)'
      });
    }

    // Set unlock secret
    await beneficiary.setUnlockSecret(unlockSecret);
    
    // Store encryption keys
    beneficiary.encryptionKeys = {
      publicKeyJwk,
      encryptedPrivateKeyBlob
    };
    
    beneficiary.completeEnrollment();
    await beneficiary.save();

    // Log enrollment
    await log('beneficiary_enrolled', {
      userId: beneficiary.userId,
      details: { beneficiaryId: beneficiary._id, email: beneficiary.email }
    });

    res.status(200).json({
      success: true,
      message: 'Enrollment successful'
    });
  } catch (err) {
    console.error('Enrollment error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DEPRECATED: Old email-only login - returns 410 Gone
// Use /login/start and /login/verify instead
router.post('/login', async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'This endpoint is deprecated. Use POST /login/start followed by POST /login/verify for secure OTP-based login.'
  });
});

// Generate and send OTP for beneficiary login
router.post('/login/start', beneficiaryAuthLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const beneficiary = await Beneficiary.findOne({ email }).populate('userId', 'name');
    
    if (!beneficiary) {
      // Don't reveal if email exists
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists, an OTP has been sent.' 
      });
    }

    // Check enrollment status
    if (beneficiary.enrollmentStatus !== 'enrolled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please complete enrollment first' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store hashed OTP
    await beneficiary.setLoginOtp(otp);
    await beneficiary.save();

    // Send OTP via email (console in FREE_MODE)
    try {
      await sendEmail({
        to: beneficiary.email,
        subject: 'Your LastKey Login Code',
        html: `
          <h2>Login Verification Code</h2>
          <p>Your one-time login code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 4px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `,
        otp: otp // Pass OTP for console logging in FREE_MODE
      });
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists, an OTP has been sent.',
      // In development only, return the OTP for testing
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
    });
  } catch (err) {
    console.error('Login start error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify OTP and complete login
router.post('/login/verify', beneficiaryAuthLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const beneficiary = await Beneficiary.findOne({ email }).populate('userId', 'name triggerStatus');
    
    if (!beneficiary) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check enrollment status
    if (beneficiary.enrollmentStatus !== 'enrolled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please complete enrollment first' 
      });
    }

    // Verify OTP
    const otpResult = await beneficiary.verifyLoginOtp(otp);
    
    if (!otpResult.valid) {
      await beneficiary.save(); // Save attempt count
      
      const messages = {
        no_otp: 'No active login request found. Please start login again.',
        expired: 'Login code has expired. Please request a new one.',
        too_many_attempts: 'Too many failed attempts. Please request a new code.',
        invalid: 'Invalid login code. Please try again.'
      };
      
      return res.status(401).json({ 
        success: false, 
        message: messages[otpResult.reason] || 'Invalid credentials'
      });
    }

    // Clear OTP and save
    beneficiary.loginOtp = undefined;
    await beneficiary.save();

    // Generate token
    const token = signToken(beneficiary._id);

    // Log login
    await log('beneficiary_login', {
      userId: beneficiary.userId._id,
      details: { beneficiaryId: beneficiary._id, email: beneficiary.email },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      token,
      data: {
        beneficiary: {
          id: beneficiary._id,
          name: beneficiary.name,
          email: beneficiary.email,
          relationship: beneficiary.relationship,
          hasEncryptionKeys: !!beneficiary.encryptionKeys?.publicKeyJwk,
          hasVaultShare: !!beneficiary.vaultShare?.encryptedDek
        },
        owner: {
          name: beneficiary.userId.name,
          triggered: beneficiary.userId.triggerStatus === 'triggered'
        }
      }
    });
  } catch (err) {
    console.error('Login verify error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Request emergency access (only works if owner is triggered)
router.post('/request-access', exports.protectBeneficiary, validate(requestAccessSchema), async (req, res) => {
  try {
    const { beneficiary, owner } = req;

    // Check if owner is triggered
    if (owner.triggerStatus !== 'triggered') {
      return res.status(403).json({
        success: false,
        message: 'Legacy not yet available. The owner is still active.'
      });
    }

    // Check for existing pending/granted access
    const existingGrant = await EmergencyAccessGrant.findOne({
      ownerId: owner._id,
      beneficiaryId: beneficiary._id,
      status: { $in: ['pending', 'granted'] }
    });

    if (existingGrant) {
      return res.status(200).json({
        success: true,
        data: {
          grantId: existingGrant._id,
          status: existingGrant.status,
          grantedAt: existingGrant.grantedAt,
          expiresAt: existingGrant.expiresAt
        }
      });
    }

    // Create new access request
    const grant = await EmergencyAccessGrant.create({
      ownerId: owner._id,
      beneficiaryId: beneficiary._id,
      status: 'pending',
      waitPeriodHours: 0, // Can be configured per beneficiary
      scopes: {
        viewAssets: true,
        viewDocuments: true,
        viewCapsules: true,
        downloadFiles: true
      },
      accessLevel: beneficiary.accessLevel || 'view',
      requestIp: req.ip,
      requestUserAgent: req.headers['user-agent']
    });

    // Auto-grant for now (can add wait period logic later)
    grant.status = 'granted';
    grant.grantedAt = new Date();
    grant.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await grant.save();

    // Log access grant
    await log('emergency_access_granted', {
      userId: owner._id,
      details: { 
        beneficiaryId: beneficiary._id, 
        grantId: grant._id 
      }
    });

    res.status(200).json({
      success: true,
      data: {
        grantId: grant._id,
        status: grant.status,
        grantedAt: grant.grantedAt,
        expiresAt: grant.expiresAt,
        scopes: grant.scopes
      }
    });
  } catch (err) {
    console.error('Request access error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create emergency session (after verifying unlock secret)
router.post('/create-session', exports.protectBeneficiary, async (req, res) => {
  try {
    const { beneficiary, owner } = req;
    const { unlockSecret, grantId } = req.body;

    if (!unlockSecret || !grantId) {
      return res.status(400).json({
        success: false,
        message: 'Unlock secret and grant ID are required'
      });
    }

    // Verify grant exists and is valid
    const grant = await EmergencyAccessGrant.findOne({
      _id: grantId,
      beneficiaryId: beneficiary._id,
      status: 'granted'
    });

    if (!grant || !grant.isValid()) {
      return res.status(403).json({
        success: false,
        message: 'Access grant is invalid or expired'
      });
    }

    // Verify unlock secret
    const isValidSecret = await beneficiary.verifyUnlockSecret(unlockSecret);
    if (!isValidSecret) {
      // Log failed attempt
      await log('emergency_session_failed', {
        userId: owner._id,
        details: { beneficiaryId: beneficiary._id, reason: 'invalid_unlock_secret' },
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid unlock secret'
      });
    }

    // Generate session token
    const sessionToken = EmergencySession.generateToken();
    const sessionTokenHash = EmergencySession.hashToken(sessionToken);

    // Create session
    const session = await EmergencySession.create({
      grantId: grant._id,
      beneficiaryId: beneficiary._id,
      ownerId: owner._id,
      sessionTokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Log session creation
    await log('emergency_session_created', {
      userId: owner._id,
      details: { 
        beneficiaryId: beneficiary._id, 
        sessionId: session._id 
      }
    });

    res.status(200).json({
      success: true,
      data: {
        sessionToken,
        expiresAt: session.expiresAt,
        scopes: grant.scopes
      }
    });
  } catch (err) {
    console.error('Create session error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify session and get access info
router.get('/session', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No session token' });
    }

    const tokenHash = EmergencySession.hashToken(token);
    const session = await EmergencySession.findOne({
      sessionTokenHash: tokenHash,
      status: 'active'
    }).populate('grantId');

    if (!session || !session.isValid()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    // Extend session on activity
    await session.extend();

    res.status(200).json({
      success: true,
      data: {
        expiresAt: session.expiresAt,
        scopes: session.grantId?.scopes,
        ownerId: session.ownerId
      }
    });
  } catch (err) {
    console.error('Session verify error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout/destroy session
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const tokenHash = EmergencySession.hashToken(token);
      const session = await EmergencySession.findOne({ sessionTokenHash: tokenHash });
      
      if (session) {
        await session.revoke('User logout');
      }
    }

    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
module.exports.protectBeneficiary = exports.protectBeneficiary;
