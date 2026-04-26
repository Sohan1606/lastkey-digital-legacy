const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || subject
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, id: result.data?.id };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

exports.sendWelcomeEmail = async (to, name) => {
  return exports.sendEmail({
    to,
    subject: 'Welcome to LastKey Digital Legacy',
    html: `
      <div style="font-family:Arial; max-width:600px; margin:0 auto; background:#070e1b; color:#f0f4ff; padding:40px; border-radius:16px;">
        <div style="text-align:center; margin-bottom:32px;">
          <span style="font-size:28px; font-weight:800; color:#ffffff;">
            Last<span style="color:#f59e0b;">Key</span>
          </span>
        </div>
        <h1 style="color:#4f9eff; text-align:center;">
          Welcome, ${name}! 🔐
        </h1>
        <p style="color:#8899bb; line-height:1.7; text-align:center;">
          Your digital legacy vault is now active.
          Your most important information is encrypted
          and protected.
        </p>
        <div style="text-align:center; margin:32px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard"
             style="background:linear-gradient(135deg,#4f9eff,#7c5cfc); color:white; padding:16px 32px; border-radius:10px; text-decoration:none; font-weight:bold;">
            Go to Dashboard →
          </a>
        </div>
        <p style="color:#3d5070; font-size:12px; text-align:center;">
          AES-256 Encrypted · Zero Knowledge · Your keys, your data
        </p>
      </div>
    `
  });
};

exports.sendInactivityWarningEmail = async (to, name, daysRemaining, checkInUrl) => {
  return exports.sendEmail({
    to,
    subject: `Action Required: Check in to LastKey (${daysRemaining} days remaining)`,
    html: `
      <div style="font-family:Arial; max-width:600px; margin:0 auto; background:#070e1b; color:#f0f4ff; padding:40px; border-radius:16px;">
        <div style="text-align:center; margin-bottom:32px;">
          <span style="font-size:28px; font-weight:800; color:#ffffff;">
            Last<span style="color:#f59e0b;">Key</span>
          </span>
        </div>
        <h1 style="color:#ffb830; text-align:center;">
          ⚠️ Inactivity Warning
        </h1>
        <p style="color:#8899bb; line-height:1.7; text-align:center;">
          Hello ${name}, we have not seen you in a while.
        </p>
        <div style="background:rgba(255,184,48,0.1); border:1px solid rgba(255,184,48,0.3); border-radius:12px; padding:20px; margin:24px 0; text-align:center;">
          <p style="color:#ffb830; font-size:18px; font-weight:bold; margin:0;">
            Your trigger activates in ${daysRemaining} days
          </p>
        </div>
        <p style="color:#8899bb; text-align:center;">
          Click below to confirm you are okay and reset your timer.
        </p>
        <div style="text-align:center; margin:32px 0;">
          <a href="${checkInUrl}"
             style="background:linear-gradient(135deg,#4f9eff,#7c5cfc); color:white; padding:16px 32px; border-radius:10px; text-decoration:none; font-weight:bold;">
            ✓ I am Here — Reset Timer
          </a>
        </div>
        <p style="color:#3d5070; font-size:12px; text-align:center;">
          If you do not check in, your beneficiaries will be notified.
        </p>
      </div>
    `
  });
};

exports.sendTriggerActivationEmail = async (to, beneficiaryName, ownerName, portalUrl) => {
  const subject = `${ownerName} has left something important for you`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#030508; font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#030508;">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#070e1b; border-radius:16px; border:1px solid rgba(255,255,255,0.06);">
        
        <!-- Header -->
        <tr>
          <td align="center" style="padding:32px 40px 0;">
            <span style="font-size:28px; font-weight:800; color:#ffffff; font-family:Arial,sans-serif;">
              Last<span style="color:#f59e0b;">Key</span>
            </span>
            <br>
            <span style="font-size:11px; color:#3d5070; letter-spacing:0.1em;">
              DIGITAL LEGACY
            </span>
          </td>
        </tr>

        <!-- Icon -->
        <tr>
          <td align="center" style="padding:24px 40px 0;">
            <div style="font-size:48px;">&#128153;</div>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td align="center" style="padding:16px 40px 0;">
            <h1 style="margin:0; font-size:24px; font-weight:700; color:#4f9eff; font-family:Arial,sans-serif;">
              A Message From ${ownerName}
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:24px 40px;">
            <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#8899bb; text-align:center;">
              Hello ${beneficiaryName},
            </p>
            <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#8899bb; text-align:center;">
              ${ownerName} has designated you as a trusted 
              beneficiary of their digital legacy.
            </p>
            <p style="margin:0; font-size:15px; line-height:1.7; color:#8899bb; text-align:center;">
              They have left important information and 
              messages for you in a secure encrypted vault.
            </p>
          </td>
        </tr>

        <!-- Info Box -->
        <tr>
          <td style="padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(79,158,255,0.1); border:1px solid rgba(79,158,255,0.2); border-radius:12px;">
              <tr>
                <td style="padding:20px; text-align:center;">
                  <p style="margin:0; font-size:14px; color:#93c5fd; line-height:1.6;">
                    Click the button below to access what 
                    ${ownerName} left for you.<br>
                    You will need to verify your identity 
                    before viewing.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Button -->
        <tr>
          <td align="center" style="padding:32px 40px;">
            <a href="${portalUrl}" 
               target="_blank"
               style="display:inline-block; background:linear-gradient(135deg,#4f9eff,#7c5cfc); color:#ffffff; text-decoration:none; padding:16px 40px; border-radius:10px; font-size:16px; font-weight:700; font-family:Arial,sans-serif;">
              Access Your Inheritance &#8594;
            </a>
          </td>
        </tr>

        <!-- Expiry Notice -->
        <tr>
          <td align="center" style="padding:0 40px 16px;">
            <p style="margin:0; font-size:13px; color:#ffb830;">
              &#9200; This link expires in 30 days
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none; border-top:1px solid rgba(255,255,255,0.06); margin:0;">
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 40px 32px;">
            <p style="margin:0 0 8px; font-size:12px; color:#3d5070;">
              LastKey Digital Legacy
            </p>
            <p style="margin:0; font-size:12px; color:#3d5070;">
              All access is encrypted, logged and secured.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return exports.sendEmail({ to, subject, html });
};

exports.sendCheckInConfirmation = async (to, name, nextCheckInDate) => {
  return exports.sendEmail({
    to,
    subject: 'Check-in confirmed — Your legacy timer reset',
    html: `
      <div style="font-family:Arial; max-width:600px; margin:0 auto; background:#070e1b; color:#f0f4ff; padding:40px; border-radius:16px;">
        <div style="text-align:center; margin-bottom:32px;">
          <span style="font-size:28px; font-weight:800; color:#ffffff;">
            Last<span style="color:#f59e0b;">Key</span>
          </span>
        </div>
        <h1 style="color:#00e5a0; text-align:center;">
          ✅ Check-in Confirmed
        </h1>
        <p style="color:#8899bb; text-align:center;">
          Hello ${name}, your inactivity timer has been reset.
        </p>
        <div style="background:rgba(0,229,160,0.1); border:1px solid rgba(0,229,160,0.2); border-radius:12px; padding:20px; margin:24px 0; text-align:center;">
          <p style="color:#00e5a0; margin:0;">
            Next check-in reminder: ${nextCheckInDate}
          </p>
        </div>
        <p style="color:#3d5070; font-size:12px; text-align:center;">
          Your beneficiaries will only be notified if 
          you become inactive again.
        </p>
      </div>
    `
  });
};

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