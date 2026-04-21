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
      console.log('✅ Email transporter verified (SMTP mode)');
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

      console.log(`✅ Email sent [attempt ${attempt}]: ${subject} → ${to}`);
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