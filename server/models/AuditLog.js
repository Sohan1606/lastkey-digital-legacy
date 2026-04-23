const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Auth actions
      'LOGIN',
      'LOGOUT',
      'LOGIN_FAILED',
      'REGISTER',
      'PASSWORD_CHANGED',
      'PASSWORD_RESET_REQUESTED',
      'PASSWORD_RESET_COMPLETED',
      'EMAIL_VERIFIED',
      'TOKEN_REFRESHED',
      'CHECKIN_RECORDED',
      'INACTIVITY_WARNING_SENT',

      // Vault/Asset actions
      'VAULT_ITEM_CREATED',
      'VAULT_ITEM_VIEWED',
      'VAULT_ITEM_UPDATED',
      'VAULT_ITEM_DELETED',
      'VAULT_ACCESSED',
      'VAULT_ACCESS',
      'VAULT_CREATE',
      'VAULT_UPDATE',
      'VAULT_DELETE',
      'VAULT_VIEW',

      // Beneficiary actions
      'BENEFICIARY_ADDED',
      'BENEFICIARY_UPDATED',
      'BENEFICIARY_REMOVED',
      'BENEFICIARY_INVITED',
      'BENEFICIARY_SHARE_ADDED',
      'BENEFICIARY_SHARE_ACCESSED',
      'BENEFICIARY_SHARE_REVOKED',

      // Trigger/Capsule actions
      'TRIGGER_CREATED',
      'TRIGGER_UPDATED',
      'TRIGGER_DELETED',
      'TRIGGER_ACTIVATED',
      'TRIGGER_PAUSED',

      // Portal actions
      'BENEFICIARY_PORTAL_ACCESSED',
      'BENEFICIARY_PORTAL_VERIFIED',
      'PORTAL_ITEM_REVEALED',
      'PORTAL_NEW_DEVICE_ACCESS',
      'PORTAL_ACCESS_REVOKED',
      'LEGACY_CLAIMED',
      'MANUAL_VERIFICATION_REQUESTED',

      // Document actions
      'DOCUMENT_UPLOADED',
      'DOCUMENT_VIEWED',
      'DOCUMENT_DOWNLOADED',
      'DOCUMENT_SCANNED',
      'DOCUMENT_DELETED',

      // Account actions
      'ACCOUNT_UPDATED',
      'ACCOUNT_DELETED',
      'SETTINGS_UPDATED',
      'SUBSCRIPTION_UPDATED',

      // Security actions
      'SUSPICIOUS_ACTIVITY',
      'RATE_LIMIT_HIT',
      'UNAUTHORIZED_ACCESS',

      // AI actions
      'AI_QUERY',
      'LEGACY_SCORE_VIEWED',
      'SUGGESTIONS_VIEWED',

      // Key Management actions
      'DEK_INITIALIZED',
      'DEK_ROTATED',

      // Migration actions
      'LEGACY_ASSET_MIGRATED',
      'LEGACY_ASSET_REENCRYPTED',
      'LEGACY_BATCH_MIGRATION',

      // General
      'DATA_EXPORTED',
      'NOTIFICATION_SENT',
      'CHECKIN_REMINDER_SENT'
    ]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  resourceType: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  location: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: false });

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
