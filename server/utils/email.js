const nodemailer = require('nodemailer');

let transporter = null;

try {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('✅ Email transporter configured');
  } else {
    console.log('⚠️ Email not configured - skipping email sending');
  }
} catch (error) {
  console.log('❌ Email transporter error:', error.message);
  transporter = null;
}

// Re-export from new email service for backwards compatibility
const { sendEmail } = require('../services/emailService');
exports.sendEmail = sendEmail;
