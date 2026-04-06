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

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    if (!transporter) {
      console.log('⚠️ Email skipped (no transporter)');
      return { success: false, message: 'Email service disabled' };
    }

    await transporter.sendMail({
      from: `"LastKey" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.log(`❌ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

