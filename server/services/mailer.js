/**
 * Mailer Service
 * 
 * Abstracts email delivery with multiple backends:
 * - console: Print to terminal (FREE_MODE, development)
 * - ethereal: Use Ethereal Email (testing)
 * - smtp: Use real SMTP server (production)
 * 
 * Environment variables:
 * - FREE_MODE=true: Forces console mode
 * - EMAIL_MODE=console|ethereal|smtp
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (for smtp mode)
 */

const nodemailer = require('nodemailer');

let transporter = null;
let etherealAccount = null;

/**
 * Determine which email mode to use
 */
const getEmailMode = () => {
  if (process.env.FREE_MODE === 'true') {
    return 'console';
  }
  return process.env.EMAIL_MODE || 'console';
};

/**
 * Initialize transporter based on mode
 */
const initTransporter = async () => {
  if (transporter) return transporter;
  
  const mode = getEmailMode();
  
  if (mode === 'console') {
    return null;
  }
  
  if (mode === 'ethereal') {
    // Create test account on Ethereal
    if (!etherealAccount) {
      etherealAccount = await nodemailer.createTestAccount();
    }
    
    transporter = nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass
      }
    });
    return transporter;
  }
  
  if (mode === 'smtp') {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP not configured, falling back to console mode');
      return null;
    }
    
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Verify connection
    try {
      await transporter.verify();
    } catch (err) {
      console.error('❌ SMTP connection failed:', err.message);
      console.warn('⚠️ Falling back to console mode');
      transporter = null;
      return null;
    }
    
    return transporter;
  }
  
  console.warn(`⚠️ Unknown email mode: ${mode}, using console`);
  return null;
};

/**
 * Format email for console output
 */
const formatConsoleEmail = ({ to, subject, html, otp }) => {
  const width = 70;
  const line = '='.repeat(width);
  const now = new Date().toISOString();
  
  // Extract text from HTML for console readability
  const textContent = html
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<script[^>]*>.*?<\/script>/gs, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300);
  
  return `
${line}
📧 EMAIL (CONSOLE MODE) - ${now}
${line}
TO:      ${to}
SUBJECT: ${subject}
${otp ? `\n🔐 OTP CODE: ${otp}\n` : ''}
CONTENT: ${textContent}${textContent.length >= 300 ? '...' : ''}
${line}
`;
};

/**
 * Send email with retry logic
 */
const sendEmail = async ({ to, subject, html, otp, attachments = [] }, maxRetries = 3) => {
  const mode = getEmailMode();
  
  // Console mode: print and return success
  if (mode === 'console' || !transporter) {
    const output = formatConsoleEmail({ to, subject, html, otp });
    return { 
      success: true, 
      mode: 'console',
      message: 'Email printed to console (FREE_MODE)'
    };
  }
  
  // Ensure transporter is initialized
  const t = await initTransporter();
  if (!t) {
    // Fallback to console
    const output = formatConsoleEmail({ to, subject, html, otp });
    return { 
      success: true, 
      mode: 'console',
      message: 'Email printed to console (fallback)'
    };
  }
  
  // Send with retries
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await t.sendMail({
        from: process.env.EMAIL_FROM || '"LastKey" <noreply@lastkey.io>',
        to,
        subject,
        html,
        attachments
      });
      
      // If using Ethereal, show preview URL
      if (mode === 'ethereal' && info.messageId) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
      }
      
      return {
        success: true,
        mode,
        messageId: info.messageId,
        previewUrl: mode === 'ethereal' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (err) {
      console.error(`📧 Email attempt ${attempt}/${maxRetries} failed:`, err.message);
      
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1000));
      }
    }
  }
  
  // All retries failed
  console.error(`📧 Failed to send email after ${maxRetries} attempts`);
  return {
    success: false,
    mode,
    error: 'Failed to send email after retries'
  };
};

/**
 * Send OTP email specifically
 */
const sendOTP = async (email, otp, purpose = 'login') => {
  const subject = purpose === 'login' 
    ? 'Your LastKey Login Code'
    : 'Your LastKey Verification Code';
  
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #00e5a0; margin-bottom: 16px;">${purpose === 'login' ? 'Login Verification' : 'Verification'}</h2>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">
        Your one-time ${purpose} code is:
      </p>
      <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #001a12; font-family: monospace;">
          ${otp}
        </span>
      </div>
      <p style="color: #666; font-size: 14px;">
        This code expires in 10 minutes.<br>
        If you didn't request this code, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #999; font-size: 12px;">
        LastKey Digital Legacy - Secure Legacy Management
      </p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
    otp
  });
};

/**
 * Send Guardian Protocol notification
 */
const sendGuardianNotification = async (beneficiaryEmail, ownerName, inactivityDays) => {
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #ff4d6d; margin-bottom: 16px;">LastKey Alert: Guardian Protocol Activated</h2>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">
        <strong>${ownerName}</strong> has been inactive for an extended period.
      </p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">
        Their LastKey Digital Legacy has been <strong>automatically activated</strong>.
      </p>
      <p style="color: #666; font-size: 14px;">
        Inactivity duration was set to ${inactivityDays} days.
      </p>
      <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/beneficiary-portal" 
           style="display: inline-block; background: #00e5a0; color: #001a12; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; font-weight: 600;">
          Access Beneficiary Portal
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #999; font-size: 12px;">
        LastKey Digital Legacy - Secure Legacy Management
      </p>
    </div>
  `;
  
  return sendEmail({
    to: beneficiaryEmail,
    subject: 'LastKey Alert: Guardian Protocol Activated',
    html
  });
};

module.exports = {
  sendEmail,
  sendOTP,
  sendGuardianNotification,
  getEmailMode,
  initTransporter
};
