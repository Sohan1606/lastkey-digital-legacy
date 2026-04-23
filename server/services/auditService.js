const AuditLog = require('../models/AuditLog');

exports.log = async (action, { userId, resourceId = null, resourceType = null, req, metadata = {}, riskLevel = 'low' } = {}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resourceId,
      resourceType,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers['user-agent'],
      metadata,
      riskLevel,
      timestamp: new Date()
    });
  } catch (err) {
    // Never let audit logging crash the app
    console.error('Audit log error:', err.message);
  }
};
