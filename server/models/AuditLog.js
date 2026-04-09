const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: String, required: true }, // 'login', 'vault_access', 'trigger_fired', 'email_sent', 'ping'
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
}, { timestamps: false });

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ event: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
