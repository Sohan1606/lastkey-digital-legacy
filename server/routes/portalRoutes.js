const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const BeneficiaryAccess = require('../models/BeneficiaryAccess');
const Beneficiary = require('../models/Beneficiary');
const Asset = require('../models/Asset');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Helper: Get device fingerprint from request
const getDeviceFingerprint = (req) => ({
  ip: req.ip || req.connection.remoteAddress,
  userAgent: req.headers['user-agent'] || 'Unknown',
  screenResolution: req.body.screenResolution || 'Unknown',
  timezone: req.body.timezone || 'Unknown'
});

// Helper: Check if devices match
const devicesMatch = (device1, device2) => {
  return device1.ip === device2.ip && device1.userAgent === device2.userAgent;
};

// Helper: Generate session token
const generateSessionToken = () => crypto.randomBytes(32).toString('hex');

// ─────────────────────────────────────────────
// ROUTE 1: Verify token and get initial info
// GET /api/portal/:token
// Returns: owner name + verification question
// Does NOT return any items yet
// ─────────────────────────────────────────────
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    // Find the access record
    const access = await BeneficiaryAccess
      .findOne({ token })
      .populate('ownerId', 'name email')
      .populate('beneficiaryId', 'name email');

    if (!access) {
      return res.status(404).json({
        status: 'fail',
        code: 'INVALID_LINK',
        message: 'This link is invalid or has expired.'
      });
    }

    if (access.isRevoked) {
      return res.status(403).json({
        status: 'fail',
        code: 'LINK_REVOKED',
        message: 'This access link has been revoked by the account owner.'
      });
    }

    if (new Date() > access.expiresAt) {
      return res.status(410).json({
        status: 'fail',
        code: 'LINK_EXPIRED',
        message: 'This access link has expired after 30 days.'
      });
    }

    // Track first access
    if (!access.hasBeenAccessed) {
      access.hasBeenAccessed = true;
      access.firstAccessedAt = new Date();
      access.firstAccessIp = clientIp;
      access.firstAccessDevice = userAgent;
      await access.save();

      // Alert owner that someone opened the link
      try {
        const { sendEmail } = require('../utils/email');
        await sendEmail({
          to: access.ownerId.email,
          subject: `[${access.beneficiaryId.name}] accessed your legacy portal`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
              <h2 style="color:#4f9eff;margin-bottom:16px">Portal Access Alert</h2>
              <p><strong>${access.beneficiaryId.name}</strong> opened your legacy portal.</p>
              <div style="background:rgba(79,158,255,0.06);border:1px solid rgba(79,158,255,0.15);border-radius:12px;padding:16px;margin:16px 0">
                <p style="margin:0 0 8px 0;color:#8899bb;font-size:13px">Access Details:</p>
                <ul style="margin:0;padding-left:20px;color:#f0f4ff;font-size:13px">
                  <li>Time: ${new Date().toLocaleString()}</li>
                  <li>IP: ${clientIp}</li>
                  <li>Device: ${userAgent}</li>
                </ul>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send portal access alert:', emailError);
      }

      await AuditLog.create({
        userId: access.ownerId._id,
        action: 'BENEFICIARY_PORTAL_ACCESSED',
        resourceId: access._id,
        resourceType: 'BeneficiaryAccess',
        ipAddress: clientIp,
        userAgent,
        metadata: {
          beneficiaryName: access.beneficiaryId.name,
          isFirstAccess: true
        },
        riskLevel: 'medium',
        timestamp: new Date()
      });
    }

    // Return only what they need to verify
    // NEVER return items before verification
    return res.status(200).json({
      status: 'success',
      data: {
        ownerName: access.ownerId.name,
        beneficiaryName: access.beneficiaryId.name,
        verificationQuestion: access.verificationQuestion,
        verificationHint: access.beneficiaryId.verificationHint || '',
        isVerified: access.isVerified,
        isClaimed: access.isClaimed,
        expiresAt: access.expiresAt,
        itemCount: access.assignedItems.length
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Portal unavailable. Please try again.'
    });
  }
});

// ─────────────────────────────────────────────
// ROUTE 2: Verify identity answer
// POST /api/portal/:token/verify
// Body: { answer: string }
// Returns: session access + items
// ─────────────────────────────────────────────
router.post('/:token/verify', async (req, res) => {
  try {
    const { token } = req.params;
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide your answer.'
      });
    }

    const access = await BeneficiaryAccess
      .findOne({ token })
      .populate('ownerId', 'name email')
      .populate('beneficiaryId', 'name email')
      .populate('assignedItems');

    if (!access || access.isRevoked) {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied.'
      });
    }

    // Check attempt limit
    if (access.verificationAttempts >= 3) {
      // Revoke the link after 3 failures
      access.isRevoked = true;
      access.revokedAt = new Date();
      await access.save();

      // Alert owner
      try {
        const { sendEmail } = require('../utils/email');
        await sendEmail({
          to: access.ownerId.email,
          subject: `[${access.beneficiaryId.name}] failed verification - Link revoked`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
              <h2 style="color:#ff4d6d;margin-bottom:16px">Verification Failed - Link Revoked</h2>
              <p><strong>${access.beneficiaryId.name}</strong> failed verification 3 times.</p>
              <p>The portal link has been revoked for security.</p>
              <p>Time: ${new Date().toLocaleString()}</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send revocation alert:', emailError);
      }

      return res.status(403).json({
        status: 'fail',
        code: 'LINK_REVOKED',
        message: 'Too many failed attempts. This link has been revoked for security. Contact the estate administrator.'
      });
    }

    // Check the answer using Beneficiary model method
    const beneficiary = await Beneficiary.findById(access.beneficiaryId._id);
    const answerClean = answer.toLowerCase().trim();
    const isCorrect = await beneficiary.verifyVerificationAnswer(answerClean);

    if (!isCorrect) {
      access.verificationAttempts += 1;
      await access.save();

      const remaining = 3 - access.verificationAttempts;

      return res.status(401).json({
        status: 'fail',
        message: `Incorrect answer. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` 
      });
    }

    // Correct answer — mark as verified
    access.isVerified = true;
    access.verifiedAt = new Date();
    access.lastAccessedAt = new Date();
    access.accessCount += 1;
    await access.save();

    // Decrypt and prepare items
    const items = access.assignedItems.map(item => ({
      _id: item._id,
      title: item.title,
      type: item.type,
      category: item.category,
      content: item.encryptedContent || item.content,
      notes: item.notes || '',
      createdAt: item.createdAt
    }));

    // Log successful verification
    await AuditLog.create({
      userId: access.ownerId._id,
      action: 'BENEFICIARY_PORTAL_VERIFIED',
      resourceId: access._id,
      resourceType: 'BeneficiaryAccess',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        beneficiaryName: access.beneficiaryId.name,
        itemCount: items.length
      },
      riskLevel: 'low',
      timestamp: new Date()
    });

    return res.status(200).json({
      status: 'success',
      data: {
        ownerName: access.ownerId.name,
        beneficiaryName: access.beneficiaryId.name,
        beneficiaryEmail: access.beneficiaryId.email,
        items,
        expiresAt: access.expiresAt,
        isClaimed: access.isClaimed,
        token
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Verification failed. Please try again.'
    });
  }
});

// ─────────────────────────────────────────────
// ROUTE 3: Beneficiary claims their own account
// POST /api/portal/:token/claim
// Body: { name, password }
// Creates new LastKey account for beneficiary
// Copies their items to their new vault
// ─────────────────────────────────────────────
router.post('/:token/claim', async (req, res) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    const access = await BeneficiaryAccess
      .findOne({ token, isVerified: true })
      .populate('beneficiaryId')
      .populate('assignedItems')
      .populate('ownerId', 'name');

    if (!access) {
      return res.status(403).json({
        status: 'fail',
        message: 'Please verify your identity first.'
      });
    }

    if (access.isClaimed) {
      return res.status(400).json({
        status: 'fail',
        message: 'This legacy has already been claimed.'
      });
    }

    const beneficiaryEmail = access.beneficiaryId.email;

    // Check if account already exists with this email
    const existingUser = await User.findOne({ 
      email: beneficiaryEmail 
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'An account with this email already exists. Please sign in to your existing account.',
        code: 'ACCOUNT_EXISTS'
      });
    }

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 8 characters.'
      });
    }

    // Create new user account for beneficiary
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await User.create({
      name: name || access.beneficiaryId.name,
      email: beneficiaryEmail,
      password: hashedPassword,
      emailVerified: true,
      isBeneficiaryAccount: true,
      inheritedFrom: access.ownerId._id,
      createdAt: new Date()
    });

    // Copy assigned items to their new vault
    const copiedItems = [];
    for (const item of access.assignedItems) {
      const copiedItem = await Asset.create({
        owner: newUser._id,
        title: item.title,
        type: item.type,
        category: item.category,
        encryptedContent: item.encryptedContent 
          || item.content,
        notes: item.notes,
        inheritedFrom: access.ownerId._id,
        isInherited: true,
        originalItemId: item._id,
        createdAt: new Date()
      });
      copiedItems.push(copiedItem);
    }

    // Mark access as claimed
    access.isClaimed = true;
    access.claimedAt = new Date();
    access.claimedByUserId = newUser._id;
    await access.save();

    // Log the claim
    await AuditLog.create({
      userId: access.ownerId._id,
      action: 'LEGACY_CLAIMED',
      resourceId: access._id,
      resourceType: 'BeneficiaryAccess',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        beneficiaryName: newUser.name,
        beneficiaryEmail: newUser.email,
        itemsCopied: copiedItems.length,
        newUserId: newUser._id
      },
      riskLevel: 'low',
      timestamp: new Date()
    });

    // Send confirmation email to owner
    try {
      const { sendEmail } = require('../utils/email');
      await sendEmail({
        to: access.ownerId.email,
        subject: `Your legacy was claimed by ${access.beneficiaryId.name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
            <h2 style="color:#00e5a0;margin-bottom:16px">Legacy Delivered Successfully</h2>
            <p><strong>${access.beneficiaryId.name}</strong> has claimed their inheritance and created their own LastKey account.</p>
            <p><strong>${copiedItems.length} items</strong> were transferred to their vault.</p>
            <p>Your legacy has been delivered successfully.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send delivery confirmation:', emailError);
    }

    // Send welcome email to beneficiary
    try {
      const { sendEmail } = require('../utils/email');
      await sendEmail({
        to: newUser.email,
        subject: 'Welcome to LastKey - Your inherited items are ready',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
            <h2 style="color:#4f9eff;margin-bottom:16px">Welcome to LastKey</h2>
            <p>Your LastKey account has been created successfully.</p>
            <p><strong>${copiedItems.length} inherited items</strong> are now in your personal vault.</p>
            <p>You have permanent independent access to these items.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Generate JWT for immediate login
    const jwt = await import('jsonwebtoken');
    const env = require('../config/env').env;
    const authToken = jwt.default.sign(
      { id: newUser._id },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully. Your inherited items are now in your vault.',
      data: {
        token: authToken,
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          isBeneficiaryAccount: true
        },
        itemsCopied: copiedItems.length
      }
    });

  } catch (error) {
    console.error('Claim error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create account.'
    });
  }
});

// ─────────────────────────────────────────────
// ROUTE 4: Log item reveal
// POST /api/portal/:token/log-reveal
// Body: { itemId, itemTitle }
// ─────────────────────────────────────────────
router.post('/:token/log-reveal', async (req, res) => {
  try {
    const { token } = req.params;
    const { itemId, itemTitle } = req.body;

    const access = await BeneficiaryAccess
      .findOne({ token, isVerified: true })
      .populate('ownerId', '_id email name')
      .populate('beneficiaryId', 'name');

    if (!access) {
      return res.status(403).json({ 
        status: 'fail' 
      });
    }

    await AuditLog.create({
      userId: access.ownerId._id,
      action: 'PORTAL_ITEM_REVEALED',
      resourceId: itemId,
      resourceType: 'Asset',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        itemTitle,
        beneficiaryName: access.beneficiaryId.name,
        tokenUsed: token.substring(0, 8) + '...'
      },
      riskLevel: 'low',
      timestamp: new Date()
    });

    return res.status(200).json({ status: 'success' });

  } catch (error) {
    return res.status(200).json({ status: 'success' });
  }
});

// ─────────────────────────────────────────────
// ROUTE 5: Request manual verification
// POST /api/portal/:token/manual-verification
// Body: { reason, fullName, relationship }
// ─────────────────────────────────────────────
router.post('/:token/manual-verification', async (req, res) => {
  try {
    const { reason, fullName, relationship } = req.body;

    if (!reason || !fullName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide your full name and reason.'
      });
    }

    const access = await BeneficiaryAccess
      .findOne({ token: req.params.token })
      .populate('beneficiaryId', 'name email')
      .populate('ownerId', 'name');

    if (!access) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid link'
      });
    }

    if (access.manualVerificationStatus !== 'none') {
      return res.status(400).json({
        status: 'fail',
        message: 'Manual verification already requested. Our team will contact you within 3-5 business days.'
      });
    }

    access.manualVerificationStatus = 'requested';
    await access.save();

    await AuditLog.create({
      userId: access.ownerId._id,
      action: 'MANUAL_VERIFICATION_REQUESTED',
      resourceId: access._id,
      resourceType: 'BeneficiaryAccess',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        beneficiaryName: access.beneficiaryId.name,
        submittedName: fullName,
        relationship,
        reason
      },
      riskLevel: 'high',
      timestamp: new Date()
    });

    // Send email to LastKey support team
    const { sendManualVerificationRequest } = require('../services/emailService');
    const env = require('../config/env').env;
    await sendManualVerificationRequest(
      env.SUPPORT_EMAIL || 'support@lastkey.com',
      access.beneficiaryId.name,
      access.beneficiaryId.email,
      access.ownerId.name,
      reason,
      req.params.token
    );

    // Send confirmation to beneficiary
    const { sendManualVerificationConfirmation } = require('../services/emailService');
    await sendManualVerificationConfirmation(
      access.beneficiaryId.email,
      access.beneficiaryId.name
    );

    return res.status(200).json({
      status: 'success',
      message: 'Manual verification request submitted. Our team will contact you at your registered email within 3-5 business days.'
    });

  } catch (error) {
    console.error('Manual verification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit request'
    });
  }
});

module.exports = router;
