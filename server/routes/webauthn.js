const express = require('express');
const jwt = require('jsonwebtoken');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const { env } = require('../config/env');
const { protect } = require('../middleware/auth');

const User = require('../models/User');
const Beneficiary = require('../models/Beneficiary');
const { log } = require('../services/auditService');

const router = express.Router();

// RP configuration
const rpName = 'LastKey Digital Legacy';
const rpID = env.WEBAUTHN_RP_ID || 'localhost';
const origin = env.FRONTEND_URL || 'http://localhost:5173';

// ----------------------------
// In-memory challenge store (dev/college friendly)
// ----------------------------
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const challengeStore = new Map();
/**
 * key -> { challenge, expiresAt }
 */
function setChallenge(key, challenge) {
  challengeStore.set(key, { challenge, expiresAt: Date.now() + CHALLENGE_TTL_MS });
}

function getChallenge(key) {
  const item = challengeStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    challengeStore.delete(key);
    return null;
  }
  return item.challenge;
}

function consumeChallenge(key) {
  const ch = getChallenge(key);
  challengeStore.delete(key);
  return ch;
}

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of challengeStore.entries()) {
    if (now > v.expiresAt) challengeStore.delete(k);
  }
}, 60 * 1000);

// ----------------------------
// Helpers
// ----------------------------
function b64urlToBuffer(b64url) {
  return Buffer.from(b64url, 'base64url');
}
function bufferToB64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

// Lazy load beneficiary JWT protect to avoid circular import issues
const getProtectBeneficiary = () => {
  const mod = require('./beneficiaryAuth'); // exported router with properties
  const fn = mod?.protectBeneficiary;
  if (typeof fn !== 'function') {
    throw new Error('protectBeneficiary is not exported correctly from beneficiaryAuth.js');
  }
  return fn;
};

// ======================================================
// OWNER WEBAUTHN (Passkey) — Secure Registration
// ======================================================

/**
 * POST /api/webauthn/register-options
 * Owner must be logged in (JWT).
 */
router.post('/register-options', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const email = req.user.email;
    const name = req.user.name || email;

    const user = await User.findById(userId).select('+webauthnCredentials');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const excludeCredentials = (user.webauthnCredentials || []).map((cred) => ({
      id: b64urlToBuffer(cred.credentialId),
      type: 'public-key'
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(userId), // v13 requires Buffer, not string
      userName: email,
      userDisplayName: name,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      }
    });

    setChallenge(`owner:reg:${userId}`, options.challenge);

    return res.status(200).json({ success: true, data: options });
  } catch (err) {
    console.error('WebAuthn register options error:', err.message);
    console.error('Stack:', err.stack);
    console.error('User:', req.user);
    return res.status(500).json({ success: false, message: 'Failed to generate registration options', error: err.message });
  }
});

/**
 * POST /api/webauthn/verify-registration
 * Owner must be logged in (JWT).
 */
router.post('/verify-registration', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ success: false, message: 'Missing required fields: response' });
    }

    const expectedChallenge = consumeChallenge(`owner:reg:${userId}`);
    if (!expectedChallenge) {
      return res.status(400).json({ success: false, message: 'Registration challenge expired. Please try again.' });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ success: false, message: 'Registration verification failed' });
    }

    const user = await User.findById(userId).select('+webauthnCredentials');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.webauthnCredentials) user.webauthnCredentials = [];

    user.webauthnCredentials.push({
      credentialId: bufferToB64url(verification.registrationInfo.credentialID),
      publicKey: bufferToB64url(verification.registrationInfo.credentialPublicKey),
      counter: verification.registrationInfo.counter,
      deviceName: 'Passkey'
    });

    await user.save();

    await log('webauthn_registered', {
      userId: user._id,
      details: { credentialId: bufferToB64url(verification.registrationInfo.credentialID) }
    });

    return res.status(200).json({ success: true, message: 'Passkey registered successfully' });
  } catch (err) {
    console.error('WebAuthn verify registration error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to verify registration' });
  }
});

// ======================================================
// OWNER WEBAUTHN LOGIN (Optional)
// ======================================================

/**
 * POST /api/webauthn/auth-options
 * Public endpoint (login flow).
 * We avoid user enumeration by using a generic message.
 */
router.post('/auth-options', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const user = await User.findOne({ email }).select('+webauthnCredentials');
    if (!user || !user.webauthnCredentials || user.webauthnCredentials.length === 0) {
      return res.status(400).json({ success: false, message: 'No passkeys found for this user' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials: user.webauthnCredentials.map((cred) => ({
        id: b64urlToBuffer(cred.credentialId),
        type: 'public-key'
      }))
    });

    setChallenge(`owner:auth:${user._id.toString()}`, options.challenge);

    return res.status(200).json({ success: true, data: options });
  } catch (err) {
    console.error('WebAuthn auth options error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to generate authentication options' });
  }
});

/**
 * POST /api/webauthn/verify-authentication
 * Public endpoint (login flow).
 */
router.post('/verify-authentication', async (req, res) => {
  try {
    const { email, response } = req.body || {};
    if (!email || !response) {
      return res.status(400).json({ success: false, message: 'Missing required fields: email, response' });
    }

    const user = await User.findOne({ email }).select('+webauthnCredentials');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const expectedChallenge = consumeChallenge(`owner:auth:${user._id.toString()}`);
    if (!expectedChallenge) {
      return res.status(400).json({ success: false, message: 'Authentication challenge expired. Please try again.' });
    }

    const credentialId = response.id; // base64url string
    const credential = user.webauthnCredentials.find((c) => c.credentialId === credentialId);
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Credential not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: b64urlToBuffer(credential.credentialId),
        credentialPublicKey: b64urlToBuffer(credential.publicKey),
        counter: credential.counter
      }
    });

    if (!verification.verified) {
      return res.status(400).json({ success: false, message: 'Authentication failed' });
    }

    // Update counter
    credential.counter = verification.authenticationInfo.newCounter;
    await user.save();

    // Issue JWT
    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '90d' });

    await log('login_webauthn', {
      userId: user._id,
      details: { email: user.email },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      token,
      data: { user: { id: user._id, name: user.name, email: user.email } }
    });
  } catch (err) {
    console.error('WebAuthn verify authentication error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to verify authentication' });
  }
});

// ======================================================
// BENEFICIARY WEBAUTHN (Optional enrollment hardening)
// ======================================================

/**
 * POST /api/webauthn/beneficiary/register-options
 * Beneficiary must be logged in (beneficiary JWT).
 */
router.post('/beneficiary/register-options', (req, res, next) => getProtectBeneficiary()(req, res, next), async (req, res) => {
  try {
    const beneficiaryId = req.beneficiary._id.toString();
    const email = req.beneficiary.email;
    const name = req.beneficiary.name || email;

    const options = await generateRegistrationOptions({
      rpName: `${rpName} - Beneficiary Portal`,
      rpID,
      userID: beneficiaryId,
      userName: email,
      userDisplayName: name,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      }
    });

    setChallenge(`ben:reg:${beneficiaryId}`, options.challenge);

    return res.status(200).json({ success: true, data: options });
  } catch (err) {
    console.error('Beneficiary WebAuthn register options error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to generate registration options' });
  }
});

/**
 * POST /api/webauthn/beneficiary/verify-registration
 * Beneficiary must be logged in (beneficiary JWT).
 */
router.post('/beneficiary/verify-registration', (req, res, next) => getProtectBeneficiary()(req, res, next), async (req, res) => {
  try {
    const beneficiaryId = req.beneficiary._id.toString();
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ success: false, message: 'Missing required fields: response' });
    }

    const expectedChallenge = consumeChallenge(`ben:reg:${beneficiaryId}`);
    if (!expectedChallenge) {
      return res.status(400).json({ success: false, message: 'Registration challenge expired. Please try again.' });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ success: false, message: 'Registration verification failed' });
    }

    const beneficiary = await Beneficiary.findById(beneficiaryId);
    if (!beneficiary) return res.status(404).json({ success: false, message: 'Beneficiary not found' });

    if (!beneficiary.webauthnCredentials) beneficiary.webauthnCredentials = [];

    beneficiary.webauthnCredentials.push({
      credentialId: bufferToB64url(verification.registrationInfo.credentialID),
      publicKey: bufferToB64url(verification.registrationInfo.credentialPublicKey),
      counter: verification.registrationInfo.counter,
      deviceName: 'Beneficiary Passkey'
    });

    await beneficiary.save();

    await log('beneficiary_webauthn_registered', {
      userId: beneficiary.userId,
      details: { beneficiaryId: beneficiary._id, credentialId: bufferToB64url(verification.registrationInfo.credentialID) }
    });

    return res.status(200).json({ success: true, message: 'Passkey registered successfully' });
  } catch (err) {
    console.error('Beneficiary WebAuthn verify registration error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to verify registration' });
  }
});

module.exports = router;