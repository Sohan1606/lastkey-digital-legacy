/**
 * Thin wrapper for email service
 * Delegates to services/emailService.js for all email operations
 */
const emailService = require('../services/emailService');

module.exports = {
  sendEmail: emailService.sendEmail,
  sendEmailWithRetry: emailService.sendEmailWithRetry,
  sendPortalAccessAlert: emailService.sendPortalAccessAlert,
  sendLegacyDeliveredConfirmation: emailService.sendLegacyDeliveredConfirmation
};