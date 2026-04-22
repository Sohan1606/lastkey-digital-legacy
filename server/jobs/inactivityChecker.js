/**
 * Inactivity Checker Cron Job
 * 
 * This job runs periodically to check for inactive users and trigger
 * the Guardian Protocol when a user has been inactive for their
 * configured duration.
 * 
 * Usage: This should be scheduled to run every hour using node-cron
 * Example: cron.schedule('0 * * * *', require('./jobs/inactivityChecker'));
 */

const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * Check for inactive users and trigger Guardian Protocol
 * @param {Object} options - Configuration options
 * @param {boolean} options.dryRun - If true, don't actually send notifications (default: false)
 * @param {boolean} options.verbose - Enable detailed logging (default: false)
 */
async function checkInactiveUsers(options = {}) {
  const { dryRun = false, verbose = false } = options;
  
  try {
    if (verbose) {
      logger.info('Starting inactivity checker job...');
    }

    // Get all users with Guardian Protocol enabled
    const users = await User.find({
      'guardianProtocol.enabled': true,
      'guardianProtocol.inactivityDuration': { $exists: true, $gt: 0 }
    });

    if (verbose) {
      logger.info(`Found ${users.length} users with Guardian Protocol enabled`);
    }

    const inactiveUsers = [];
    const notificationsSent = [];

    for (const user of users) {
      const { guardianProtocol } = user;
      const { inactivityDuration, beneficiaries, alertChannels } = guardianProtocol;
      
      // Calculate the cutoff date
      const cutoffDate = new Date(Date.now() - (inactivityDuration * 60 * 1000));
      
      // Check if user has been inactive
      const lastActivity = user.lastActivity || user.createdAt;
      const isInactive = lastActivity < cutoffDate;
      
      if (isInactive) {
        inactiveUsers.push({
          userId: user._id,
          email: user.email,
          name: user.name,
          lastActivity,
          inactivityDuration,
          beneficiaries: beneficiaries || [],
          alertChannels: alertChannels || ['email']
        });

        if (verbose) {
          logger.info(`User ${user.email} has been inactive since ${lastActivity}`);
        }

        // Send notifications (unless in dry run mode)
        if (!dryRun) {
          try {
            await sendInactivityNotifications(user, lastActivity, inactivityDuration);
            notificationsSent.push(user.email);
            
            // Update user's last notification sent timestamp
            user.guardianProtocol.lastNotificationSent = new Date();
            await user.save();
            
          } catch (notificationError) {
            logger.error(`Failed to send notifications to user ${user.email}:`, notificationError);
          }
        }
      }
    }

    const summary = {
      totalUsers: users.length,
      inactiveUsers: inactiveUsers.length,
      notificationsSent: notificationsSent.length,
      dryRun,
      timestamp: new Date().toISOString()
    };

    if (verbose || inactiveUsers.length > 0) {
      logger.info('Inactivity checker summary:', summary);
    }

    return summary;

  } catch (error) {
    logger.error('Inactivity checker job failed:', error);
    throw error;
  }
}

/**
 * Send inactivity notifications to a user's beneficiaries
 * @param {Object} user - The user object
 * @param {Date} lastActivity - The user's last activity timestamp
 * @param {number} inactivityDuration - The inactivity duration in minutes
 */
async function sendInactivityNotifications(user, lastActivity, inactivityDuration) {
  const { name, email, guardianProtocol } = user;
  const { beneficiaries, alertChannels } = guardianProtocol;
  
  if (!beneficiaries || beneficiaries.length === 0) {
    logger.warn(`User ${email} has no beneficiaries configured`);
    return;
  }

  // Format the inactivity duration for human readability
  const formattedDuration = formatDuration(inactivityDuration);
  const lastActivityFormatted = lastActivity.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Send notifications to each beneficiary
  for (const beneficiary of beneficiaries) {
    try {
      const notificationData = {
        userName: name,
        userEmail: email,
        beneficiaryName: beneficiary.name,
        beneficiaryEmail: beneficiary.email,
        lastActivity: lastActivityFormatted,
        inactivityDuration: formattedDuration,
        accessLevel: beneficiary.accessLevel || 'view'
      };

      // Send email notification
      if (alertChannels.includes('email')) {
        await emailService.sendInactivityAlert(notificationData);
      }

      // TODO: Add other notification channels (WhatsApp, Telegram) when implemented
      // if (alertChannels.includes('whatsapp')) {
      //   await whatsappService.sendInactivityAlert(notificationData);
      // }
      // if (alertChannels.includes('telegram')) {
      //   await telegramService.sendInactivityAlert(notificationData);
      // }

    } catch (error) {
      logger.error(`Failed to send notification to beneficiary ${beneficiary.email}:`, error);
      // Continue with other beneficiaries even if one fails
    }
  }
}

/**
 * Format duration in minutes to human-readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes < 1440) { // Less than 24 hours
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return `${days} day${days !== 1 ? 's' : ''} and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
  }
}

/**
 * Initialize the inactivity checker cron job
 * @param {string} schedule - Cron schedule pattern (default: '0 * * * *' - every hour)
 * @param {Object} options - Configuration options
 */
function initializeInactivityChecker(schedule = '0 * * * *', options = {}) {
  if (!cron.validate(schedule)) {
    throw new Error(`Invalid cron schedule: ${schedule}`);
  }

  logger.info(`Initializing inactivity checker with schedule: ${schedule}`);
  
  const job = cron.schedule(schedule, async () => {
    try {
      await checkInactiveUsers(options);
    } catch (error) {
      logger.error('Scheduled inactivity checker job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  return job;
}

/**
 * Manual trigger for testing purposes
 * @param {Object} options - Configuration options
 */
async function triggerManualCheck(options = {}) {
  logger.info('Manually triggering inactivity check...');
  return await checkInactiveUsers({ ...options, verbose: true });
}

// Export functions for use in other modules
module.exports = {
  checkInactiveUsers,
  sendInactivityNotifications,
  formatDuration,
  initializeInactivityChecker,
  triggerManualCheck
};

// If this file is run directly, perform a manual check
if (require.main === module) {
  triggerManualCheck({ dryRun: true })
    .then((result) => {
      console.log('Manual inactivity check completed (dry run):', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Manual inactivity check failed:', error);
      process.exit(1);
    });
}
