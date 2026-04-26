const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { log } = require('../services/auditService');

// Ensure JWT_SECRET is configured - env validation should catch this at boot
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Token blacklist for logout
const tokenBlacklist = new Set();

exports.blacklistToken = (token) => {
  tokenBlacklist.add(token);
  // Auto-remove after 7 days
  setTimeout(() => tokenBlacklist.delete(token), 7 * 24 * 60 * 60 * 1000);
};

exports.isBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

exports.protect = async (req, res, next) => {
  console.log('=== AUTH DEBUG ===');
  console.log('Authorization header:', req.headers.authorization?.substring(0, 30));
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
  
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to access this route.'
      });
    }

    // Check if token is blacklisted
    if (exports.isBlacklisted(token)) {
      return res.status(401).json({
        status: 'fail',
        message: 'Token has been revoked. Please log in again.'
      });
    }

    const decoded = await promisify(jwt.verify)(token, JWT_SECRET, {
      issuer: 'lastkey-api',
      audience: 'lastkey-client'
    });
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user no longer exists.'
      });
    }

    // Check for multiple failed logins
    const recentFailedLogins = await AuditLog.countDocuments({
      userId: decoded.id,
      action: 'LOGIN_FAILED',
      timestamp: {
        $gte: new Date(Date.now() - 30 * 60 * 1000)
      }
    });

    if (recentFailedLogins >= 5) {
      // Log suspicious activity
      await log('SUSPICIOUS_ACTIVITY', {
        userId: decoded.id,
        req,
        metadata: {
          reason: 'Multiple failed login attempts',
          count: recentFailedLogins
        },
        riskLevel: 'critical'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.'
    });
  }
};
