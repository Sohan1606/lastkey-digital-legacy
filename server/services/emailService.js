const nodemailer = require('nodemailer');

let transporter = null;

// Check if we're in FREE_MODE or console email mode
const isConsoleMode = () => {
  return process.env.FREE_MODE === 'true' || 
         process.env.EMAIL_MODE === 'console' ||
         !process.env.EMAIL_HOST ||
         !process.env.EMAIL_USER ||
         !process.env.EMAIL_PASS;
};

const initTransporter = () => {
  if (transporter) return transporter;
  if (isConsoleMode()) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return transporter;
};

/**
 * Console email output for FREE_MODE
 * Prints email details clearly to terminal for demo/testing
 */
const logEmailToConsole = ({ to, subject, html, otp }) => {
  const border = '='.repeat(70);
  console.log('\n' + border);
  console.log('📧 EMAIL (CONSOLE MODE - FREE_MODE)');
  console.log(border);
  console.log(`TO:      ${to}`);
  console.log(`SUBJECT: ${subject}`);
  if (otp) {
    console.log('');
    console.log('🔐 OTP CODE:', otp);
    console.log('');
  }
  // Extract text content from HTML for console readability
  const textContent = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
  console.log('CONTENT:', textContent + (textContent.length >= 500 ? '...' : ''));
  console.log(border + '\n');
};

exports.sendEmailWithRetry = async ({ to, subject, html, otp }, maxAttempts = 3) => {
  // In FREE_MODE or console mode, log to console instead of sending
  if (isConsoleMode()) {
    logEmailToConsole({ to, subject, html, otp });
    return { success: true, mode: 'console' };
  }

  const t = initTransporter();
  if (!t) {
    console.log(`Email skipped (not configured): ${subject} → ${to}`);
    return { success: false, reason: 'not_configured' };
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await t.sendMail({
        from: `"LastKey" <${process.env.EMAIL_USER}>`,
        to, subject, html,
      });
      console.log(`Email sent [attempt ${attempt}]: ${subject} → ${to}`);
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error(`Email attempt ${attempt}/${maxAttempts} failed for ${to}:`, err.message);
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, attempt * 2000)); // exponential backoff
      }
    }
  }
  return { success: false, reason: 'max_retries_exceeded' };
};

// Keep backwards-compatible sendEmail for existing calls
exports.sendEmail = exports.sendEmailWithRetry;
