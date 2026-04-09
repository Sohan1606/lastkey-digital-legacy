const nodemailer = require('nodemailer');

let transporter = null;

const initTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured');
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

exports.sendEmailWithRetry = async ({ to, subject, html }, maxAttempts = 3) => {
  const t = initTransporter();
  if (!t) {
    console.log(`Email skipped (not configured): ${subject} \u2192 ${to}`);
    return { success: false, reason: 'not_configured' };
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await t.sendMail({
        from: `"LastKey" <${process.env.EMAIL_USER}>`,
        to, subject, html,
      });
      console.log(`Email sent [attempt ${attempt}]: ${subject} \u2192 ${to}`);
      return { success: true };
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
