const nodemailer = require('nodemailer');
const { env } = require('../config/env');

let transporter = null;
let transporterVerified = false;

const isConsoleMode = () => env.FREE_MODE === 'true' || env.EMAIL_MODE === 'console';

const stripHtmlToText = (html) => {
  if (!html) return '';
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Console email output for FREE_MODE / console mode
 */
const logEmailToConsole = ({ to, subject, html, text, otp }) => {
  const border = '='.repeat(72);
  console.log('\n' + border);
  console.log('📧 EMAIL (CONSOLE MODE)');
  console.log(border);
  console.log(`TO:      ${to}`);
  console.log(`SUBJECT: ${subject}`);
  if (otp) {
    console.log('');
    console.log('🔐 OTP CODE:', otp);
    console.log('');
  }
  const preview = stripHtmlToText(text || html).slice(0, 500);
  if (preview) console.log('CONTENT:', preview + (preview.length >= 500 ? '…' : ''));
  console.log(border + '\n');
};

const initTransporter = async () => {
  if (isConsoleMode()) return null;
  if (transporter) return transporter;

  // SMTP mode requires config
  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASS) {
    throw new Error(
      'EMAIL_MODE=smtp but EMAIL_HOST/EMAIL_USER/EMAIL_PASS are missing. ' +
        'Set them or use EMAIL_MODE=console (FREE_MODE).'
    );
  }

  const port = Number(env.EMAIL_PORT || 587);

  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS }
  });

  // Verify once (non-fatal warning if fails)
  if (!transporterVerified) {
    try {
      await transporter.verify();
      transporterVerified = true;
    } catch (e) {
      console.warn('⚠️ SMTP transporter verify failed:', e.message);
    }
  }

  return transporter;
};

/**
 * sendEmailWithRetry({ to, subject, html, text, otp }, maxAttempts)
 * - Console mode: prints to terminal
 * - SMTP mode: sends real email
 */
exports.sendEmailWithRetry = async ({ to, subject, html, text, otp }, maxAttempts = 3) => {
  if (!to) throw new Error('sendEmail: "to" is required');
  if (!subject) throw new Error('sendEmail: "subject" is required');

  // FREE_MODE / console mode
  if (isConsoleMode()) {
    logEmailToConsole({ to, subject, html, text, otp });
    return { success: true, mode: 'console' };
  }

  const t = await initTransporter();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await t.sendMail({
        from: env.EMAIL_FROM || `"LastKey" <${env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text
      });

      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error(`❌ Email attempt ${attempt}/${maxAttempts} failed for ${to}:`, err.message);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }

  return { success: false, reason: 'max_retries_exceeded' };
};

// Backwards compatible
exports.sendEmail = exports.sendEmailWithRetry;

/**
 * sendPortalAccessAlert(ownerEmail, ownerName, beneficiaryName, ip, time, isFailed)
 * Sends email to owner when beneficiary accesses portal
 */
exports.sendPortalAccessAlert = async (ownerEmail, ownerName, beneficiaryName, ip, time, isFailed = false) => {
  const subject = isFailed 
    ? `[${beneficiaryName}] failed verification - Link revoked`
    : `[${beneficiaryName}] accessed your legacy portal`;

  const html = isFailed 
    ? `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
        <h2 style="color:#ff4d6d;margin-bottom:16px">Verification Failed - Link Revoked</h2>
        <p><strong>${beneficiaryName}</strong> failed verification 3 times.</p>
        <p>The portal link has been revoked for security.</p>
        <p>Time: ${time}</p>
      </div>
    `
    : `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
        <h2 style="color:#4f9eff;margin-bottom:16px">Portal Access Alert</h2>
        <p><strong>${beneficiaryName}</strong> opened your legacy portal.</p>
        <div style="background:rgba(79,158,255,0.06);border:1px solid rgba(79,158,255,0.15);border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px 0;color:#8899bb;font-size:13px">Access Details:</p>
          <ul style="margin:0;padding-left:20px;color:#f0f4ff;font-size:13px">
            <li>Time: ${time}</li>
            <li>IP: ${ip}</li>
          </ul>
        </div>
      </div>
    `;

  return exports.sendEmail({ to: ownerEmail, subject, html });
};

/**
 * sendLegacyDeliveredConfirmation(ownerEmail, ownerName, beneficiaryName, itemCount)
 * Sends email to owner when beneficiary claims their legacy
 */
exports.sendLegacyDeliveredConfirmation = async (ownerEmail, ownerName, beneficiaryName, itemCount) => {
  const subject = `Your legacy was claimed by ${beneficiaryName}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
      <h2 style="color:#00e5a0;margin-bottom:16px">Legacy Delivered Successfully</h2>
      <p><strong>${beneficiaryName}</strong> has claimed their inheritance and created their own LastKey account.</p>
      <p><strong>${itemCount} items</strong> were transferred to their vault.</p>
      <p>Your legacy has been delivered successfully.</p>
    </div>
  `;

  return exports.sendEmail({ to: ownerEmail, subject, html });
};

/**
 * sendWelcomeEmail(beneficiaryEmail, beneficiaryName, isBeneficiaryAccount)
 * Sends welcome email to new user
 */
exports.sendWelcomeEmail = async (beneficiaryEmail, beneficiaryName, isBeneficiaryAccount = false) => {
  const subject = isBeneficiaryAccount 
    ? 'Welcome to LastKey - Your inherited items are ready'
    : 'Welcome to LastKey';

  const html = isBeneficiaryAccount
    ? `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
        <h2 style="color:#4f9eff;margin-bottom:16px">Welcome to LastKey</h2>
        <p>Your LastKey account has been created successfully.</p>
        <p>Your inherited items are now in your personal vault.</p>
        <p>You have permanent independent access to these items.</p>
      </div>
    `
    : `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
        <h2 style="color:#4f9eff;margin-bottom:16px">Welcome to LastKey</h2>
        <p>Your LastKey account has been created successfully.</p>
        <p>Start securing your digital legacy today.</p>
      </div>
    `;

  return exports.sendEmail({ to, beneficiaryEmail, subject, html });
};

/**
 * sendManualVerificationRequest(supportEmail, beneficiaryName, beneficiaryEmail, ownerName, reason, token)
 * Sends manual verification request to support team
 */
exports.sendManualVerificationRequest = async (supportEmail, beneficiaryName, beneficiaryEmail, ownerName, reason, token) => {
  const subject = 'MANUAL VERIFICATION REQUEST — LastKey Portal';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
      <h2 style="color:#ffb830;margin-bottom:16px">Manual Verification Request</h2>
      <p><strong>Beneficiary:</strong> ${beneficiaryName} (${beneficiaryEmail})</p>
      <p><strong>Owner:</strong> ${ownerName}</p>
      <p><strong>Reason:</strong> ${reason || 'Not provided'}</p>
      <p><strong>Portal Token:</strong> ${token}</p>
      <p><strong>Requested At:</strong> ${new Date().toLocaleString()}</p>
      <p style="color:#8899bb">Please review and verify this beneficiary's identity within 3-5 business days.</p>
    </div>
  `;

  return exports.sendEmail({ to: supportEmail, subject, html });
};

/**
 * sendManualVerificationConfirmation(to, beneficiaryName)
 * Sends confirmation to beneficiary that manual verification was requested
 */
exports.sendManualVerificationConfirmation = async (to, beneficiaryName) => {
  const subject = 'Your verification request was received';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
      <h2 style="color:#4f9eff;margin-bottom:16px">Verification Request Received</h2>
      <p>We received your manual verification request.</p>
      <p>Our team will review and contact you within 3-5 business days.</p>
      <p style="color:#8899bb">We will email you at this address: ${to}</p>
      <p style="margin-top:24px">For support, contact support@lastkey.com</p>
    </div>
  `;

  return exports.sendEmail({ to, subject, html });
};

/**
 * sendInactivityWarningEmail(to, name, daysRemaining, dashboardUrl)
 * Sends warning email when user is approaching inactivity threshold
 */
exports.sendInactivityWarningEmail = async (to, name, daysRemaining, dashboardUrl) => {
  const subject = `LastKey: Your account is inactive - ${daysRemaining} days until trigger`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
      <h2 style="color:#ffb830;margin-bottom:16px">⚠️ Inactivity Warning</h2>
      <p>We noticed you haven't logged into your LastKey account in a while.</p>
      <p style="margin:16px 0">
        <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong> remaining before your inactivity trigger activates.
      </p>
      <p>Once the trigger activates, your beneficiaries will receive access to your vault.</p>
      <p style="margin:24px 0">
        <a href="${dashboardUrl}"
           style="background:linear-gradient(135deg,#ffb830,#ff6b6b);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">
          Log In to Reset Timer
        </a>
      </p>
      <p style="color:#8899bb;font-size:12px">This is an automated warning. No action is required if you are still active.</p>
    </div>
  `;

  return exports.sendEmail({ to, subject, html });
};

/**
 * sendTriggerActivationEmail(to, beneficiaryName, ownerName, portalUrl)
 * Sends email to beneficiary when inactivity trigger fires
 */
exports.sendTriggerActivationEmail = async (to, beneficiaryName, ownerName, portalUrl) => {
  const subject = `${ownerName}'s digital legacy is now available to you`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
      <h2 style="color:#00e5a0;margin-bottom:16px">🎁 Your Legacy is Ready</h2>
      <p>Hello <strong>${beneficiaryName}</strong>,</p>
      <p><strong>${ownerName}</strong> has been inactive, and their inactivity trigger has activated.</p>
      <p style="margin:16px 0">You now have access to the digital legacy items assigned to you.</p>
      <p style="margin:24px 0">
        <a href="${portalUrl}"
           style="background:linear-gradient(135deg,#00e5a0,#4f9eff);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">
          Access Your Legacy
        </a>
      </p>
      <p style="color:#8899bb;font-size:12px">This access link expires in 30 days. Please complete verification to view your items.</p>
    </div>
  `;

  return exports.sendEmail({ to, subject, html });
};

/**
 * sendCheckInConfirmation(to, name, checkInDate)
 * Sends confirmation email after successful check-in
 */
exports.sendCheckInConfirmation = async (to, name, checkInDate) => {
  const subject = 'LastKey: Check-in confirmed - Timer reset';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1629;color:#f0f4ff;padding:32px;border-radius:16px">
      <h2 style="color:#00e5a0;margin-bottom:16px">✅ Check-in Confirmed</h2>
      <p>Your inactivity timer has been successfully reset.</p>
      <p style="margin:16px 0">
        <strong>Last check-in:</strong> ${new Date(checkInDate).toLocaleDateString()}
      </p>
      <p>Your beneficiaries will only be notified if you become inactive again.</p>
      <p style="margin:24px 0">
        <a href="${process.env.CLIENT_URL}/dashboard"
           style="background:linear-gradient(135deg,#4f9eff,#7c5cfc);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">
          Go to Dashboard
        </a>
      </p>
    </div>
  `;

  return exports.sendEmail({ to, subject, html });
};