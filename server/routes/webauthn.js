const express = require('express');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const User = require('../models/User');
const Beneficiary = require('../models/Beneficiary');
const { log } = require('../services/auditService');

const router = express.Router();

// RP configuration
const rpName = 'LastKey Digital Legacy';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const origin = process.env.FRONTEND_URL || 'http://localhost:5173';

// Generate registration options for owner
router.post('/register-options', async (req, res) => {
  try {
    const { userId, email, name } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ success: false, message: 'User ID and email required' });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: email,
      userDisplayName: name || email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      }
    });

    // Store challenge temporarily (in production, use Redis/session)
    // For now, we'll return it and expect it back in verification
    res.status(200).json({
      success: true,
      data: options
    });
  } catch (err) {
    console.error('WebAuthn register options error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate registration options' });
  }
});

// Verify registration for owner
router.post('/verify-registration', async (req, res) => {
  try {
    const { userId, response, challenge } = req.body;
    
    if (!userId || !response || !challenge) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });

    if (verification.verified && verification.registrationInfo) {
      // Store credential in user document
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Add WebAuthn credential
      if (!user.webauthnCredentials) {
        user.webauthnCredentials = [];
      }

      user.webauthnCredentials.push({
        credentialId: Buffer.from(verification.registrationInfo.credentialID).toString('base64url'),
        publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64url'),
        counter: verification.registrationInfo.counter,
        deviceName: response.clientExtensionResults?.deviceName || 'Unknown Device'
      });

      await user.save();

      // Log success
      await log('webauthn_registered', {
        userId: user._id,
        details: { credentialId: verification.registrationInfo.credentialID }
      });

      res.status(200).json({
        success: true,
        message: 'Passkey registered successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Registration verification failed'
      });
    }
  } catch (err) {
    console.error('WebAuthn verify registration error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to verify registration' });
  }
});

// Generate authentication options for owner
router.post('/auth-options', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email }).select('+webauthnCredentials');
    if (!user || !user.webauthnCredentials || user.webauthnCredentials.length === 0) {
      return res.status(400).json({ success: false, message: 'No passkeys found for this user' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.webauthnCredentials.map(cred => ({
        id: Buffer.from(cred.credentialId, 'base64url'),
        type: 'public-key'
      }))
    });

    res.status(200).json({
      success: true,
      data: options
    });
  } catch (err) {
    console.error('WebAuthn auth options error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate authentication options' });
  }
});

// Verify authentication for owner
router.post('/verify-authentication', async (req, res) => {
  try {
    const { email, response, challenge } = req.body;
    
    const user = await User.findOne({ email }).select('+webauthnCredentials');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the credential used
    const credential = user.webauthnCredentials.find(
      cred => cred.credentialId === Buffer.from(response.id, 'base64url').toString('base64url')
    );

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Credential not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(credential.credentialId, 'base64url'),
        credentialPublicKey: Buffer.from(credential.publicKey, 'base64url'),
        counter: credential.counter
      }
    });

    if (verification.verified) {
      // Update counter
      credential.counter = verification.authenticationInfo.newCounter;
      await user.save();

      // Generate JWT
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '90d' });

      // Log login
      await log('login_webauthn', {
        userId: user._id,
        details: { email: user.email },
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        token,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Authentication failed' });
    }
  } catch (err) {
    console.error('WebAuthn verify authentication error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to verify authentication' });
  }
});

// ========== BENEFICIARY WEBAUTHN ==========

// Generate registration options for beneficiary
router.post('/beneficiary/register-options', async (req, res) => {
  try {
    const { beneficiaryId, email, name } = req.body;
    
    const options = await generateRegistrationOptions({
      rpName: `${rpName} - Beneficiary Portal`,
      rpID,
      userID: beneficiaryId,
      userName: email,
      userDisplayName: name || email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      }
    });

    res.status(200).json({
      success: true,
      data: options
    });
  } catch (err) {
    console.error('Beneficiary WebAuthn register options error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate registration options' });
  }
});

// Verify registration for beneficiary
router.post('/beneficiary/verify-registration', async (req, res) => {
  try {
    const { beneficiaryId, response, challenge } = req.body;
    
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });

    if (verification.verified && verification.registrationInfo) {
      const beneficiary = await Beneficiary.findById(beneficiaryId);
      if (!beneficiary) {
        return res.status(404).json({ success: false, message: 'Beneficiary not found' });
      }

      if (!beneficiary.webauthnCredentials) {
        beneficiary.webauthnCredentials = [];
      }

      beneficiary.webauthnCredentials.push({
        credentialId: Buffer.from(verification.registrationInfo.credentialID).toString('base64url'),
        publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64url'),
        counter: verification.registrationInfo.counter,
        deviceName: 'Beneficiary Device'
      });

      await beneficiary.save();

      res.status(200).json({
        success: true,
        message: 'Passkey registered successfully'
      });
    } else {
      res.status(400).json({ success: false, message: 'Registration verification failed' });
    }
  } catch (err) {
    console.error('Beneficiary WebAuthn verify registration error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to verify registration' });
  }
});

module.exports = router;
