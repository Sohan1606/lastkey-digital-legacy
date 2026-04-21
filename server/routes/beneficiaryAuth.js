const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const Beneficiary = require('../models/Beneficiary');
const User = require('../models/User');
const EmergencyAccessGrant = require('../models/EmergencyAccessGrant');
const EmergencySession = require('../models/EmergencySession');

const { log } = require('../services/auditService');
const { sendEmail } = require('../utils/email');
const {
  validate,
  beneficiaryCheckStatusSchema,
  beneficiaryEnrollSchema,
  beneficiaryOtpStartSchema,
  beneficiaryOtpVerifySchema,
  requestAccessSchema,
  beneficiaryCreateSessionSchema
} = require('../validators');

const router = express.Router();

/**
 * Rate limiting for beneficiary OTP endpoints
 */
const beneficiaryAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');

const signToken = (id, type = 'beneficiary') =>
  jwt.sign({ id, type }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });

function getBearerToken(req) {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

function getSessionToken(req) {
  return req.headers['x-session-token'] || null;
}

/**
 * Middleware: protect beneficiary routes (beneficiary JWT only)
 * IMPORTANT: select +unlockSecretHash because verifyUnlockSecret needs it.
 */
const protectBeneficiary = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'beneficiary') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    // IMPORTANT: include hidden fields needed by later steps
    const beneficiary = await Beneficiary.findById(decoded.id).select('+unlockSecretHash +loginOtp.hash');
    if (!beneficiary) {
      return res.status(401).json({ success: false, message: 'Beneficiary not found' });
    }

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

/**
 * Middleware: invited beneficiaries can ONLY:
 * - POST /api/beneficiary/auth/enroll
 * - POST /api/beneficiary/auth/check-status
 */
const protectBeneficiaryEnrolled = async (req, res, next) => {
  return protectBeneficiary(req, res, () => {
    if (req.beneficiary.enrollmentStatus === 'enrolled') return next();

    const allowedPrefixes = [
      '/api/beneficiary/auth/enroll',
      '/api/beneficiary/auth/check-status'
    ];

    const ok = allowedPrefixes.some((p) => req.originalUrl.startsWith(p));
    if (!ok) {
      return res.status(403).json({
        success: false,
        message: 'Complete enrollment first to access this feature.'
      });
    }

    next();
  });
};

/**
 * Check beneficiary enrollment status by email (public)
 * IMPORTANT: select +unlockSecretHash so hasUnlockSecret is accurate
 */
router.post('/check-status', validate(beneficiaryCheckStatusSchema), async (req, res) => {
  try {
    const { email } = req.body;

    const beneficiary = await Beneficiary.findOne({ email })
      .select('+unlockSecretHash')
      .populate('userId', 'name triggerStatus');

    if (!beneficiary) {
      return res.status(200).json({ success: true, data: { status: 'not_found' } });
    }

    const ownerTriggered = beneficiary.userId?.triggerStatus === 'triggered';

    return res.status(200).json({
      success: true,
      data: {
        status: beneficiary.enrollmentStatus,
        ownerName: beneficiary.userId?.name,
        ownerTriggered,
        hasPasskey: (beneficiary.webauthnCredentials || []).length > 0,
        hasUnlockSecret: !!beneficiary.unlockSecretHash
      }
    });
  } catch (err) {
    console.error('Check status error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Enrollment (requires beneficiary JWT from OTP login)
 * Allowed only when invited.
 */
router.post('/enroll', protectBeneficiary, validate(beneficiaryEnrollSchema), async (req, res) => {
  try {
    const { unlockSecret, publicKeyJwk, encryptedPrivateKeyBlob } = req.body;
    const beneficiary = req.beneficiary;

    if (beneficiary.enrollmentStatus !== 'invited') {
      return res.status(400).json({ success: false, message: 'Beneficiary already enrolled' });
    }

    await beneficiary.setUnlockSecret(unlockSecret);
    beneficiary.encryptionKeys = { publicKeyJwk, encryptedPrivateKeyBlob };
    beneficiary.completeEnrollment();
    await beneficiary.save();

    await log('beneficiary_enrolled', {
      userId: beneficiary.userId,
      details: { beneficiaryId: beneficiary._id, email: beneficiary.email },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({ success: true, message: 'Enrollment successful' });
  } catch (err) {
    console.error('Enrollment error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Deprecated legacy endpoint
 */
router.post('/login', async (req, res) => {
  return res.status(410).json({
    success: false,
    message:
      'This endpoint is deprecated. Use POST /login/start followed by POST /login/verify for secure OTP-based login.'
  });
});

/**
 * OTP login start (invited + enrolled)
 */
router.post('/login/start', beneficiaryAuthLimiter, validate(beneficiaryOtpStartSchema), async (req, res) => {
  try {
    const { email } = req.body;

    const beneficiary = await Beneficiary.findOne({ email }).populate('userId', 'name');

    // do not reveal existence
    if (!beneficiary) {
      return res.status(200).json({ success: true, message: 'If an account exists, an OTP has been sent.' });
    }

    if (!['invited', 'enrolled'].includes(beneficiary.enrollmentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary account not ready. Please check your invitation email.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await beneficiary.setLoginOtp(otp);
    await beneficiary.save();

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
        otp
      });
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists, an OTP has been sent.',
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
    });
  } catch (err) {
    console.error('Login start error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * OTP login verify (invited + enrolled)
 * IMPORTANT: select +loginOtp.hash so verifyLoginOtp can compare hash.
 */
router.post('/login/verify', beneficiaryAuthLimiter, validate(beneficiaryOtpVerifySchema), async (req, res) => {
  try {
    const { email, otp } = req.body;

    const beneficiary = await Beneficiary.findOne({ email })
      .select('+loginOtp.hash') // IMPORTANT
      .populate('userId', 'name triggerStatus');

    if (!beneficiary) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!['invited', 'enrolled'].includes(beneficiary.enrollmentStatus)) {
      return res.status(400).json({ success: false, message: 'Beneficiary account not ready.' });
    }

    const otpResult = await beneficiary.verifyLoginOtp(otp);
    if (!otpResult.valid) {
      await beneficiary.save();

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

    // OTP cleared inside verifyLoginOtp on success, but keep safe:
    beneficiary.loginOtp = undefined;
    await beneficiary.save();

    const token = signToken(beneficiary._id);

    await log('beneficiary_login', {
      userId: beneficiary.userId?._id,
      details: { beneficiaryId: beneficiary._id, email: beneficiary.email },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      token,
      data: {
        beneficiary: {
          id: beneficiary._id,
          name: beneficiary.name,
          email: beneficiary.email,
          relationship: beneficiary.relationship,
          enrollmentStatus: beneficiary.enrollmentStatus,
          needsEnrollment: beneficiary.enrollmentStatus === 'invited',
          hasEncryptionKeys: !!beneficiary.encryptionKeys?.publicKeyJwk,
          hasVaultShare: !!beneficiary.vaultShare?.encryptedDekB64
        },
        owner: {
          name: beneficiary.userId?.name,
          triggered: beneficiary.userId?.triggerStatus === 'triggered'
        }
      }
    });
  } catch (err) {
    console.error('Login verify error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Request emergency access (triggered only)
 */
router.post('/request-access', protectBeneficiaryEnrolled, validate(requestAccessSchema), async (req, res) => {
  try {
    const { beneficiary, owner } = req;

    if (owner.triggerStatus !== 'triggered') {
      return res.status(403).json({
        success: false,
        message: 'Legacy not yet available. The owner is still active.'
      });
    }

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

    const grant = await EmergencyAccessGrant.create({
      ownerId: owner._id,
      beneficiaryId: beneficiary._id,
      status: 'pending',
      waitPeriodHours: 0,
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

    // auto-grant for now
    grant.status = 'granted';
    grant.grantedAt = new Date();
    grant.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await grant.save();

    await log('emergency_access_granted', {
      userId: owner._id,
      details: { beneficiaryId: beneficiary._id, grantId: grant._id }
    });

    return res.status(200).json({
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
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Create emergency session (unlock secret)
 * IMPORTANT: unlockSecretHash is select:false, but protectBeneficiary selects it.
 */
router.post('/create-session', protectBeneficiaryEnrolled, validate(beneficiaryCreateSessionSchema), async (req, res) => {
  try {
    const { beneficiary, owner } = req;
    const { unlockSecret, grantId } = req.body;

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

    const isValidSecret = await beneficiary.verifyUnlockSecret(unlockSecret);
    if (!isValidSecret) {
      await log('emergency_session_failed', {
        userId: owner._id,
        details: { beneficiaryId: beneficiary._id, reason: 'invalid_unlock_secret' },
        ip: req.ip
      });

      return res.status(401).json({ success: false, message: 'Invalid unlock secret' });
    }

    const sessionToken = EmergencySession.generateToken();
    const sessionTokenHash = EmergencySession.hashToken(sessionToken);

    const session = await EmergencySession.create({
      grantId: grant._id,
      beneficiaryId: beneficiary._id,
      ownerId: owner._id,
      sessionTokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    await log('emergency_session_created', {
      userId: owner._id,
      details: { beneficiaryId: beneficiary._id, sessionId: session._id }
    });

    return res.status(200).json({
      success: true,
      data: {
        sessionToken,
        expiresAt: session.expiresAt,
        scopes: grant.scopes
      }
    });
  } catch (err) {
    console.error('Create session error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Verify emergency session (expects x-session-token)
 */
router.get('/session', async (req, res) => {
  try {
    const token = getSessionToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'No session token' });

    const tokenHash = EmergencySession.hashToken(token);
    const session = await EmergencySession.findOne({
      sessionTokenHash: tokenHash,
      status: 'active'
    }).populate('grantId');

    if (!session || !session.isValid()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    await session.extend();

    return res.status(200).json({
      success: true,
      data: {
        expiresAt: session.expiresAt,
        scopes: session.grantId?.scopes,
        ownerId: session.ownerId
      }
    });
  } catch (err) {
    console.error('Session verify error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Logout / destroy session (expects x-session-token)
 */
router.post('/logout', async (req, res) => {
  try {
    const token = getSessionToken(req);

    if (token) {
      const tokenHash = EmergencySession.hashToken(token);
      const session = await EmergencySession.findOne({ sessionTokenHash: tokenHash });
      if (session) await session.revoke('User logout');
    }

    return res.status(200).json({ success: true, message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Export middlewares as properties on the router so destructuring works:
 * const { protectBeneficiary } = require('./beneficiaryAuth')
 */
router.protectBeneficiary = protectBeneficiary;
router.protectBeneficiaryEnrolled = protectBeneficiaryEnrolled;

module.exports = router;