import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>LastKey</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 
      'Segoe UI', sans-serif;
      background: #030508; 
      color: #f0f4ff;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .logo-text span { color: #f59e0b; }
    .card {
      background: #070e1b;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 40px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    p {
      font-size: 15px;
      line-height: 1.7;
      color: #8899bb;
      margin-bottom: 16px;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #3b5bdb, #7c5cfc);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      margin: 8px 0 24px;
    }
    .divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 24px 0;
    }
    .security-note {
      background: rgba(0,229,160,0.06);
      border: 1px solid rgba(0,229,160,0.15);
      border-radius: 10px;
      padding: 16px;
      font-size: 13px;
      color: #00e5a0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #3d5070;
      line-height: 1.8;
    }
    .footer a { color: #4f9eff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo">
      <span class="logo-text">Last<span>Key</span></span>
      <br>
      <small style="color:#3d5070;font-size:11px">
        Digital Legacy
      </small>
    </div>
    ${content}
    <div class="footer">
      <p>LastKey Digital Legacy</p>
      <p>
        <a href="#">Privacy Policy</a> · 
        <a href="#">Terms of Service</a> · 
        <a href="#">Support</a>
      </p>
      <p style="margin-top:8px">
        © 2024 LastKey. All rights reserved.<br>
        Your data is AES-256 encrypted and 
        zero-knowledge protected.
      </p>
    </div>
  </div>
</body>
</html>
`;

// 1. sendWelcomeEmail
export const sendWelcomeEmail = async (to, name) => {
  try {
    const content = `
      <div class="card">
        <h1>Welcome to LastKey</h1>
        <p>Welcome, <strong>${name}</strong></p>
        <p>Your digital vault is now active and encrypted.</p>
        <p>Here are your next steps to get started:</p>
        <ul style="color: #8899bb; margin: 16px 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Add vault items to secure your digital assets</li>
          <li style="margin-bottom: 8px;">Add beneficiaries to receive your legacy</li>
          <li style="margin-bottom: 8px;">Set a trigger for automatic transfer</li>
        </ul>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn">Go to Dashboard</a>
        <div class="security-note">
          Your data is AES-256 encrypted. Only you hold the keys.
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'LastKey <noreply@lastkey.digital>',
      to: [to],
      subject: 'Welcome to LastKey - Your Legacy is Protected',
      html: emailTemplate(content),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 2. sendVerificationEmail
export const sendVerificationEmail = async (to, name, verificationUrl) => {
  try {
    const content = `
      <div class="card">
        <h1>Verify Your Email</h1>
        <p>Click the button below to verify your account</p>
        <a href="${verificationUrl}" class="btn">Verify Email Address</a>
        <p style="font-size: 13px; color: #6b7280;">Link expires in 24 hours</p>
        <p style="font-size: 13px; color: #6b7280;">If you didn't create this account, ignore this email</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'LastKey <noreply@lastkey.digital>',
      to: [to],
      subject: 'Verify your LastKey email address',
      html: emailTemplate(content),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 3. sendPasswordResetEmail
export const sendPasswordResetEmail = async (to, name, resetUrl) => {
  try {
    const content = `
      <div class="card">
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your password</p>
        <a href="${resetUrl}" class="btn">Reset Password</a>
        <p style="font-size: 13px; color: #6b7280;">Link expires in 1 hour</p>
        <p style="font-size: 13px; color: #6b7280;">If you didn't request this, your account is safe</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'LastKey <noreply@lastkey.digital>',
      to: [to],
      subject: 'Reset your LastKey password',
      html: emailTemplate(content),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 4. sendBeneficiaryInvitation
export const sendBeneficiaryInvitation = async (to, beneficiaryName, ownerName, accessUrl, itemCount) => {
  try {
    const content = `
      <div class="card">
        <h1>Legacy Invitation</h1>
        <p><strong>${ownerName}</strong> has designated you as a trusted beneficiary for their digital legacy</p>
        <p>You have been granted access to <strong>${itemCount}</strong> secure vault items</p>
        <a href="${accessUrl}" class="btn">View Your Access</a>
        <p style="font-size: 13px; color: #6b7280;">This access is contingent on trigger activation</p>
        <div class="security-note">
          LastKey uses military-grade encryption to protect digital legacies. Your access is secure and private.
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'LastKey <noreply@lastkey.digital>',
      to: [to],
      subject: `${ownerName} has added you as a beneficiary on LastKey`,
      html: emailTemplate(content),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 5. sendTriggerActivationEmail
export const sendTriggerActivationEmail = async (to, beneficiaryName, ownerName, accessUrl, itemsSummary) => {
  try {
    const itemsList = itemsSummary.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('');

    const content = `
      <div class="card">
        <h1>Legacy Released</h1>
        <p>You are receiving this because <strong>${ownerName}</strong> designated you as a beneficiary</p>
        <p>The following items are now available to you:</p>
        <ul style="color: #8899bb; margin: 16px 0; padding-left: 20px;">
          ${itemsList}
        </ul>
        <a href="${accessUrl}" class="btn">Access Your Inheritance</a>
        <p style="font-size: 13px; color: #6b7280;">This link is unique to you and expires in 30 days</p>
        <p style="font-size: 13px; color: #6b7280;">For support, contact: support@lastkey.digital</p>
        <div class="security-note">
          This is a secure, one-time access link. Do not share this email.
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'LastKey <noreply@lastkey.digital>',
      to: [to],
      subject: `IMPORTANT: ${ownerName}'s digital legacy has been released to you`,
      html: emailTemplate(content),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 6. sendInactivityWarningEmail
export const sendInactivityWarningEmail = async (to, name, daysRemaining, checkInUrl) => {
  try {
    const content = `
      <div class="card">
        <h1>Action Required: Check in to LastKey</h1>
        <p>We haven't seen you in a while</p>
        <p>Your inactivity trigger will fire in <strong>${daysRemaining} days</strong> unless you check in</p>
        <a href="${checkInUrl}" class="btn">Check In Now</a>
        <p style="font-size: 13px; color: #6b7280;">If you are okay, clicking this button resets your timer</p>
        <div class="security-note">
          Your legacy is protected. This warning ensures your intentions are honored.
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'LastKey <noreply@lastkey.digital>',
      to: [to],
      subject: `Action Required: Check in to LastKey (${daysRemaining} days remaining)`,
      html: emailTemplate(content),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 7. sendCheckInConfirmation
export const sendCheckInConfirmation = async (to, name, nextCheckInDate) => {
  try {
    const content = `
      <div class="card">
        <h1>Check-in Confirmed</h1>
        <p>Your check-in was recorded</p>
        <p>Your next inactivity check is: <strong>${nextCheckInDate}</strong></p>
        <div class="security-note">
          Your digital legacy remains secure and protected. Everything is safe and sound.
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'LastKey <noreply@lastkey.digital>',
      to: [to],
      subject: 'Check-in confirmed - Your legacy timer reset',
      html: emailTemplate(content),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBeneficiaryInvitation,
  sendTriggerActivationEmail,
  sendInactivityWarningEmail,
  sendCheckInConfirmation
};
