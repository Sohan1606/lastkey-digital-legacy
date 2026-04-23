const cron = require('node-cron');
const User = require('../models/User');
const Capsule = require('../models/Capsule');
const Beneficiary = require('../models/Beneficiary');
const BeneficiaryAccess = require('../models/BeneficiaryAccess');
const { log } = require('../services/auditService');
const { 
  sendInactivityWarningEmail,
  sendTriggerActivationEmail,
  sendCheckInConfirmation
} = require('../services/emailService');
const crypto = require('crypto');

// Run every day at 9am UTC
const startInactivityChecker = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      // Get all active inactivity triggers
      const activeTriggers = await Capsule.find({
        triggerType: 'inactivity',
        isReleased: false
      }).populate('userId');

      for (const trigger of activeTriggers) {
        const user = trigger.userId;
        if (!user) continue;

        const lastLogin = user.lastLogin 
          || user.createdAt;
        const daysSinceLogin = Math.floor(
          (Date.now() - new Date(lastLogin)) / 
          (1000 * 60 * 60 * 24)
        );
        const triggerDays = 90; // Default 90 days
        const warningDays = triggerDays - 7;

        // Send warning email
        if (daysSinceLogin >= warningDays && 
            daysSinceLogin < triggerDays) {
          const daysRemaining = triggerDays - daysSinceLogin;
          
          await sendInactivityWarningEmail(
            user.email,
            user.name,
            daysRemaining,
            `${process.env.CLIENT_URL}/dashboard` 
          );

          await log('INACTIVITY_WARNING_SENT', {
            userId: user._id,
            metadata: { 
              daysSinceLogin, 
              daysRemaining,
              triggerDays
            },
            riskLevel: 'medium'
          });
        }

        // Fire trigger
        if (daysSinceLogin >= triggerDays) {
          await fireTrigger(trigger, user);
        }
      }

    } catch (error) {
      console.error('Inactivity check error:', error);
    }
  }, {
    scheduled: true,
    runOnInit: false,
    timezone: 'UTC'
  });
};

const fireTrigger = async (trigger, user) => {
  try {
    // Update trigger status
    trigger.isReleased = true;
    trigger.releasedAt = new Date();
    await trigger.save();

    // Get all beneficiaries
    const beneficiaries = await Beneficiary.find({
      userId: user._id
    });

    for (const beneficiary of beneficiaries) {
      // Generate secure token
      const token = crypto
        .randomBytes(64).toString('hex');

      // Create access record
      await BeneficiaryAccess.create({
        token,
        beneficiaryId: beneficiary._id,
        ownerId: user._id,
        assignedItems: beneficiary.assignedVaultItems || [],
        verificationQuestion: beneficiary.verificationQuestion,
        verificationAnswerHash: beneficiary.verificationAnswerHash,
        verificationHint: beneficiary.verificationHint || '',
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        )
      });

      // Send email to beneficiary
      const portalUrl = 
        `${process.env.CLIENT_URL}/portal/${token}`;

      await sendTriggerActivationEmail(
        beneficiary.email,
        beneficiary.name,
        user.name,
        portalUrl
      );
    }

    await log('TRIGGER_ACTIVATED', {
      userId: user._id,
      resourceId: trigger._id,
      resourceType: 'Capsule',
      metadata: {
        triggerId: trigger._id,
        beneficiaryCount: beneficiaries.length,
        reason: 'inactivity'
      },
      riskLevel: 'critical'
    });

  } catch (error) {
    console.error('Fire trigger error:', error);
  }
};

module.exports = { startInactivityChecker };
