// Shared Email Layout Wrapper
function getEmailLayout(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      color: #334155;
    }
    .wrapper {
      padding: 40px 20px;
      background-color: #f8fafc;
    }
    .container {
      background-color: #ffffff;
      border-radius: 24px;
      max-width: 580px;
      margin: 0 auto;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #2563eb 100%);
      padding: 35px 30px;
      text-align: center;
      color: #ffffff;
    }
    .logo {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
      display: block;
    }
    .title {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .body {
      padding: 35px 30px;
    }
    .heading {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 14px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 18px 0;
    }
    .detail-box {
      background-color: #f1f5f9;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 22px;
      border: 1px solid #e2e8f0;
    }
    .detail-row {
      margin-bottom: 8px;
      font-size: 13.5px;
      color: #334155;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      font-weight: 700;
      color: #1e293b;
    }
    .detail-value {
      color: #64748b;
      margin-left: 5px;
    }
    .btn-container {
      text-align: center;
      margin-top: 25px;
      margin-bottom: 15px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      color: #ffffff !important;
      padding: 13px 26px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
    .footer {
      text-align: center;
      padding: 25px 20px 0 20px;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      margin-top: 25px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo">TRASH2TREASURE</span>
        <h1 class="title">${title}</h1>
      </div>
      <div class="body">
        ${bodyContent}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// 1. Welcome Email
export function WelcomeEmail({ name }: { name: string }): string {
  const content = `
    <h2 class="heading">Hi ${name},</h2>
    <p class="text">
      Welcome to Trash2Treasure! We are absolutely thrilled to have you join our crowdsourced community dedicated to saving our environment.
    </p>
    <p class="text">
      By disposing of household waste responsibly, scanning disposals, and pinning recycling locations on our community maps, you earn credit points that can be redeemed for cool gifts and cash vouchers.
    </p>
    <div class="btn-container">
      <a href="https://trash2treasure-app.web.app/dashboard/home" class="btn">Explore Your Dashboard</a>
    </div>
    <div class="footer">
      Trash2Treasure Inc. • Saving the planet, one disposal at a time.
    </div>
  `;
  return getEmailLayout("Welcome to the Movement! 🌍", content);
}

// 2. Email Verification Email
export function EmailVerificationEmail({ name, url }: { name: string; url: string }): string {
  const content = `
    <h2 class="heading">Hello ${name},</h2>
    <p class="text">
      Thank you for registering! Please verify your email address to complete your account registration and unlock full access to Trash2Treasure scanning, maps, and rewards.
    </p>
    <div class="btn-container">
      <a href="${url}" class="btn">Verify Email Address</a>
    </div>
    <p class="text" style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
      If you did not sign up for this account, you can safely ignore this email. This link will expire in 24 hours.
    </p>
    <div class="footer">
      Trash2Treasure Safety Team.
    </div>
  `;
  return getEmailLayout("Verify Your Email Address ✉️", content);
}

// 3. Login Notification Email
export function LoginNotificationEmail({ name, device, time }: { name: string; device: string; time: string }): string {
  const content = `
    <h2 class="heading">Hello ${name},</h2>
    <p class="text">
      We detected a new login to your Trash2Treasure account. Please check the details below to ensure this was you:
    </p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Device/Browser:</span>
        <span class="detail-value">${device}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time:</span>
        <span class="detail-value">${time}</span>
      </div>
    </div>
    <p class="text">
      If this was you, no action is required. If you do not recognize this activity, please reset your password immediately inside your account settings.
    </p>
    <div class="footer">
      Trash2Treasure Security Division.
    </div>
  `;
  return getEmailLayout("New Login Detected 🔑", content);
}

// 4. Submission Received Email
export function SubmissionReceivedEmail({
  name,
  wasteType,
  location,
}: {
  name: string;
  wasteType: string;
  location: string;
}): string {
  const content = `
    <h2 class="heading">Hi ${name},</h2>
    <p class="text">
      Your eco-disposal submission has been successfully uploaded and registered! Our moderators are currently verifying the disposal report.
    </p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Waste Type:</span>
        <span class="detail-value">${wasteType}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span>
        <span class="detail-value">${location}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value" style="color: #f59e0b; font-weight: bold;">PENDING REVIEW</span>
      </div>
    </div>
    <p class="text">
      Once the submission is approved, your credits will be updated automatically!
    </p>
    <div class="footer">
      Thank you for keeping our community clean!
    </div>
  `;
  return getEmailLayout("Submission Received 🚮", content);
}

// 5. Submission Approved Email
export function SubmissionApprovedEmail({
  name,
  wasteType,
  points,
}: {
  name: string;
  wasteType: string;
  points: number;
}): string {
  const content = `
    <h2 class="heading">Congratulations ${name}!</h2>
    <p class="text">
      Excellent news! Our administrative moderators have verified and approved your recent disposal.
    </p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Disposal:</span>
        <span class="detail-value">${wasteType}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value" style="color: #10b981; font-weight: bold;">APPROVED</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Reward Points Added:</span>
        <span class="detail-value" style="color: #f59e0b; font-weight: bold;">🪙 +${points} T2T PTS</span>
      </div>
    </div>
    <p class="text">
      These points have been credited to your wallet balance. Keep scanning to earn more cool rewards!
    </p>
    <div class="btn-container">
      <a href="https://trash2treasure-app.web.app/dashboard/wallet" class="btn">Check Wallet Balance</a>
    </div>
    <div class="footer">
      Your activity is making a real difference.
    </div>
  `;
  return getEmailLayout("Disposal Approved 🎉", content);
}

// 6. Submission Rejected Email
export function SubmissionRejectedEmail({
  name,
  wasteType,
  reason,
}: {
  name: string;
  wasteType: string;
  reason: string;
}): string {
  const content = `
    <h2 class="heading">Hi ${name},</h2>
    <p class="text">
      We completed our review of your recent disposal submission. Regrettably, our moderators could not approve this entry.
    </p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Disposal:</span>
        <span class="detail-value">${wasteType}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value" style="color: #ef4444; font-weight: bold;">REJECTED</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Reason:</span>
        <span class="detail-value">${reason}</span>
      </div>
    </div>
    <p class="text">
      Please review our disposal guidelines and ensure both the waste item and disposal bin are clearly visible in photographs. You are welcome to try scanning again!
    </p>
    <div class="footer">
      Let's work together to maintain accurate waste mapping.
    </div>
  `;
  return getEmailLayout("Submission Update ❌", content);
}

// 7. Reward Claimed Email
export function RewardClaimedEmail({
  name,
  rewardName,
  pointsCost,
}: {
  name: string;
  rewardName: string;
  pointsCost: number;
}): string {
  const content = `
    <h2 class="heading">Hi ${name},</h2>
    <p class="text">
      We have successfully received your request to redeem points for an eco-gift!
    </p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Eco Prize:</span>
        <span class="detail-value">${rewardName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Points Deducted:</span>
        <span class="detail-value" style="color: #ef4444; font-weight: bold;">-${pointsCost} T2T PTS</span>
      </div>
    </div>
    <p class="text">
      Our team is packaging your reward. Vouchers will be delivered to your inbox, and physical items will be shipped to your registered address soon!
    </p>
    <div class="footer">
      Thank you for being a leading voice in recycling.
    </div>
  `;
  return getEmailLayout("Claim Received 🪙", content);
}

// 8. Reward Redeemed/Delivered Email
export function RewardRedeemedEmail({
  name,
  rewardName,
  voucherCode,
}: {
  name: string;
  rewardName: string;
  voucherCode: string;
}): string {
  const content = `
    <h2 class="heading">Enjoy your reward, ${name}!</h2>
    <p class="text">
      Exciting news! Your claimed reward has been processed and successfully redeemed. Here are your redemption credentials:
    </p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Eco Prize:</span>
        <span class="detail-value">${rewardName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Redemption Code:</span>
        <span class="detail-value" style="color: #10b981; font-weight: bold; font-family: monospace; font-size: 16px;">${voucherCode}</span>
      </div>
    </div>
    <p class="text">
      Use this code at checkout or copy-paste it into the partner portal to claim your reward.
    </p>
    <div class="footer">
      Thank you for your active green contributions.
    </div>
  `;
  return getEmailLayout("Reward Redeemed! 🎁", content);
}

// 9. Reward Delivered Email
export function RewardDeliveredEmail({
  name,
  rewardName,
}: {
  name: string;
  rewardName: string;
}): string {
  const content = `
    <h2 class="heading">Enjoy your reward, ${name}!</h2>
    <p class="text">
      Exciting news! Your claimed reward has been processed and successfully delivered.
    </p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Delivered Prize:</span>
        <span class="detail-value">${rewardName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value" style="color: #10b981; font-weight: bold;">SHIPPED / DELIVERED</span>
      </div>
    </div>
    <p class="text">
      Check your inbox or registered address to claim your gift! Thank you for your continued loyalty and dedication to green recycling.
    </p>
    <div class="footer">
      Keep up the fantastic work!
    </div>
  `;
  return getEmailLayout("Eco-Gift Delivered! 🎁", content);
}

// 10. Admin Notification Email
export function AdminNotificationEmail({ title, message }: { title: string; message: string }): string {
  const content = `
    <h2 class="heading">Attention Administrator,</h2>
    <p class="text">
      A system-level administrative alert has been triggered:
    </p>
    <div class="detail-box">
      <div class="detail-row" style="font-weight: bold; font-size: 15px; color: #1e293b; margin-bottom: 10px;">
        ${title}
      </div>
      <div class="detail-row" style="white-space: pre-line; line-height: 1.5;">
        ${message}
      </div>
    </div>
    <div class="footer">
      Trash2Treasure Operations Alert.
    </div>
  `;
  return getEmailLayout("System Admin Notification ⚠️", content);
}

// 11. Password Reset Email
export function PasswordResetEmail({ name, url }: { name: string; url: string }): string {
  const content = `
    <h2 class="heading">Hello ${name},</h2>
    <p class="text">
      We received a request to reset your Trash2Treasure password. Click the button below to secure your account and choose a new password:
    </p>
    <div class="btn-container">
      <a href="${url}" class="btn">Reset Account Password</a>
    </div>
    <p class="text" style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
    <div class="footer">
      Trash2Treasure Safety Team.
    </div>
  `;
  return getEmailLayout("Password Reset Request 🔒", content);
}

// 12. Account Update Email
export function AccountUpdateEmail({
  name,
  updateType,
  details,
}: {
  name: string;
  updateType: string;
  details: string;
}): string {
  const content = `
    <h2 class="heading">Hello ${name},</h2>
    <p class="text">
      This is a quick security confirmation that your account has been updated:
    </p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Update Type:</span>
        <span class="detail-value">${updateType}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Changes:</span>
        <span class="detail-value">${details}</span>
      </div>
    </div>
    <p class="text">
      If you made these changes, no action is required. If you did not authorize these edits, please get in touch with security support immediately.
    </p>
    <div class="footer">
      Trash2Treasure Operations.
    </div>
  `;
  return getEmailLayout("Account Details Updated 👤", content);
}

// 13. Announcement Email
export function AnnouncementEmail({
  title,
  message,
}: {
  title: string;
  message: string;
}): string {
  const content = `
    <h2 class="heading">${title}</h2>
    <p class="text" style="white-space: pre-line;">
      ${message}
    </p>
    <div class="btn-container">
      <a href="https://trash2treasure-app.web.app/dashboard/home" class="btn">Visit Community Portal</a>
    </div>
    <div class="footer">
      You received this as a registered member of the Trash2Treasure Network.
    </div>
  `;
  return getEmailLayout("Announcements & Updates 📢", content);
}

// 14. Email Verification OTP Email
export function OTPEmail({ name, otp }: { name: string; otp: string }): string {
  const content = `
    <h2 class="heading">Verify Your Email Address</h2>
    <p class="text">
      Hello ${name},
    </p>
    <p class="text">
      Thank you for signing up for Trash2Treasure! To complete your registration, please use the following One-Time Password (OTP) to verify your email address:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px 30px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #059669; font-family: monospace;">${otp}</span>
    </div>
    <p class="text" style="font-size: 13px; color: #64748b;">
      This OTP is valid for <strong>5 minutes</strong>. For security reasons, please do not share this code with anyone.
    </p>
    <p class="text" style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
      If you did not request this verification, you can safely ignore this email.
    </p>
    <div class="footer">
      Trash2Treasure Security Team
    </div>
  `;
  return getEmailLayout("Email Verification OTP 🔑", content);
}

