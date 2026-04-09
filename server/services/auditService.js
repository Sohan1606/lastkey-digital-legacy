const AuditLog = require('../models/AuditLog');

exports.log = async (event, { userId, details, ip, userAgent, severity = 'info' } = {}) => {
  try {
    await AuditLog.create({ event, userId, details, ip, userAgent, severity });
  } catch (err) {
    // Never let audit logging crash the app
    console.error('Audit log error:', err.message);
  }
};
