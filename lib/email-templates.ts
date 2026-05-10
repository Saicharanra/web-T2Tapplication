/**
 * Professional HTML email templates for T2T platform.
 * All templates are responsive, mobile-friendly, with T2T branding.
 */

// ── Brand Constants ──
const BRAND = {
  name: 'Trash2Treasure',
  shortName: 'T2T',
  tagline: 'Turn Waste Into Worth',
  color: '#0D9488',      // Teal-600
  colorDark: '#064E3B',  // Emerald-900
  colorLight: '#F0FDFA', // Teal-50
  colorAccent: '#10B981', // Emerald-500
  colorGold: '#F59E0B',  // Amber-500
  logo: '🌿',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://trash2treasure.vercel.app',
  supportEmail: 'support@trash2treasure.com',
};

// ── Base Layout ──
function baseLayout(content: string, previewText: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${BRAND.name}</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,sans-serif!important}</style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F1F5F9; -webkit-font-smoothing: antialiased; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background: #FFFFFF; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, ${BRAND.color}, ${BRAND.colorAccent}); color: #FFFFFF !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; transition: all 0.3s; }
    .btn:hover { opacity: 0.9; }
    .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .reward-card { background: linear-gradient(135deg, #FFFBEB, #FEF3C7); border: 1px solid #FCD34D; border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0; }
    .stat-pill { display: inline-block; background: ${BRAND.colorLight}; color: ${BRAND.colorDark}; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin: 4px; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { width: 100% !important; }
      .content-pad { padding: 24px 20px !important; }
      .btn { padding: 12px 24px !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>` : ''}
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <div class="email-wrapper" style="max-width:600px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,${BRAND.colorDark},${BRAND.color});padding:32px 32px 28px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">${BRAND.logo}</div>
            <h1 style="color:#FFFFFF;font-size:22px;font-weight:800;letter-spacing:-0.5px;margin:0;">${BRAND.name}</h1>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;font-weight:500;margin-top:4px;">${BRAND.tagline}</p>
          </div>
          
          <!-- Content -->
          <div class="content-pad" style="padding:32px;">
            ${content}
          </div>
          
          <!-- Footer -->
          <div style="background:#F8FAFC;padding:24px 32px;border-top:1px solid #E2E8F0;text-align:center;">
            <p style="color:#94A3B8;font-size:12px;line-height:1.6;margin:0;">
              © ${new Date().getFullYear()} ${BRAND.name} — Telangana<br>
              <a href="${BRAND.url}/dashboard/settings" style="color:${BRAND.color};text-decoration:none;">Manage preferences</a> · 
              <a href="${BRAND.url}" style="color:${BRAND.color};text-decoration:none;">Visit platform</a>
            </p>
            <p style="color:#CBD5E1;font-size:11px;margin-top:8px;">
              You're receiving this because you're a ${BRAND.name} member.
            </p>
          </div>
          
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Template Types ──
export type EmailTemplateType =
  | 'upload_approved'
  | 'upload_rejected'
  | 'reward_points'
  | 'reward_redeemed'
  | 'welcome'
  | 'admin_announcement'
  | 'weekly_report'
  | 'pickup_completed'
  | 'pickup_scheduled'
  | 'campaign'
  | 'referral_reward';

// ── Template Data Interfaces ──
interface UploadApprovedData {
  userName: string;
  wasteType: string;
  points: number;
  totalPoints: number;
  submissionDate: string;
  location?: string;
}

interface UploadRejectedData {
  userName: string;
  wasteType: string;
  reason: string;
  submissionDate: string;
}

interface RewardPointsData {
  userName: string;
  points: number;
  reason: string;
  totalPoints: number;
}

interface RewardRedeemedData {
  userName: string;
  rewardTitle: string;
  pointsSpent: number;
  remainingPoints: number;
}

interface WelcomeData {
  userName: string;
}

interface AnnouncementData {
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}

interface WeeklyReportData {
  userName: string;
  submissionsCount: number;
  pointsEarned: number;
  totalPoints: number;
  rank?: number;
  co2Saved: number;
  treesEquivalent: number;
}

// ── Template Generators ──

export function getUploadApprovedEmail(data: UploadApprovedData): { subject: string; html: string } {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#10B981,#059669);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
    </div>
    <h2 style="color:#1E293B;font-size:20px;font-weight:800;text-align:center;margin-bottom:8px;">Your Upload Was Approved!</h2>
    <p style="color:#64748B;font-size:14px;text-align:center;line-height:1.6;margin-bottom:24px;">
      Great job, <strong>${data.userName}</strong>! Your waste recycling submission has been verified by our team.
    </p>
    
    <div class="reward-card">
      <p style="color:#92400E;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Points Earned</p>
      <p style="color:#B45309;font-size:42px;font-weight:800;margin:0;">+${data.points}</p>
      <p style="color:#92400E;font-size:13px;margin-top:4px;">🪙 Total Balance: <strong>${data.totalPoints} points</strong></p>
    </div>
    
    <div class="card">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;color:#64748B;font-size:13px;">Waste Type</td>
          <td style="padding:8px 0;color:#1E293B;font-size:13px;font-weight:600;text-align:right;">${data.wasteType}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-top:1px solid #E2E8F0;color:#64748B;font-size:13px;">Submitted</td>
          <td style="padding:8px 0;border-top:1px solid #E2E8F0;color:#1E293B;font-size:13px;font-weight:600;text-align:right;">${data.submissionDate}</td>
        </tr>
        ${data.location ? `
        <tr>
          <td style="padding:8px 0;border-top:1px solid #E2E8F0;color:#64748B;font-size:13px;">Location</td>
          <td style="padding:8px 0;border-top:1px solid #E2E8F0;color:#1E293B;font-size:13px;font-weight:600;text-align:right;">${data.location}</td>
        </tr>` : ''}
      </table>
    </div>
    
    <div style="text-align:center;margin-top:24px;">
      <a href="${BRAND.url}/dashboard/wallet" class="btn">View Your Wallet →</a>
    </div>
    <p style="color:#94A3B8;font-size:12px;text-align:center;margin-top:16px;">Keep recycling to earn more points and unlock rewards!</p>
  `;
  return {
    subject: `✅ Upload Approved — +${data.points} Points Earned!`,
    html: baseLayout(content, `Your ${data.wasteType} submission was approved! You earned ${data.points} points.`),
  };
}

export function getUploadRejectedEmail(data: UploadRejectedData): { subject: string; html: string } {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#EF4444,#DC2626);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">❌</div>
    </div>
    <h2 style="color:#1E293B;font-size:20px;font-weight:800;text-align:center;margin-bottom:8px;">Upload Not Approved</h2>
    <p style="color:#64748B;font-size:14px;text-align:center;line-height:1.6;margin-bottom:24px;">
      Hi <strong>${data.userName}</strong>, unfortunately your submission didn't meet our requirements.
    </p>
    
    <div class="card" style="border-color:#FCA5A5;background:#FEF2F2;">
      <p style="color:#991B1B;font-size:13px;font-weight:600;margin-bottom:8px;">📋 Reason</p>
      <p style="color:#7F1D1D;font-size:14px;line-height:1.5;">${data.reason}</p>
    </div>
    
    <div class="card">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;color:#64748B;font-size:13px;">Waste Type</td>
          <td style="padding:8px 0;color:#1E293B;font-size:13px;font-weight:600;text-align:right;">${data.wasteType}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-top:1px solid #E2E8F0;color:#64748B;font-size:13px;">Submitted</td>
          <td style="padding:8px 0;border-top:1px solid #E2E8F0;color:#1E293B;font-size:13px;font-weight:600;text-align:right;">${data.submissionDate}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align:center;margin-top:24px;">
      <a href="${BRAND.url}/dashboard/scan" class="btn" style="background:linear-gradient(135deg,#3B82F6,#2563EB);">Try Again →</a>
    </div>
    <p style="color:#94A3B8;font-size:12px;text-align:center;margin-top:16px;">Tips: Use good lighting, capture the waste clearly, and select the correct type.</p>
  `;
  return {
    subject: `❌ Upload Not Approved — Please Resubmit`,
    html: baseLayout(content, `Your ${data.wasteType} submission was not approved. Here's why.`),
  };
}

export function getRewardPointsEmail(data: RewardPointsData): { subject: string; html: string } {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#F59E0B,#D97706);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🪙</div>
    </div>
    <h2 style="color:#1E293B;font-size:20px;font-weight:800;text-align:center;margin-bottom:8px;">Points Added!</h2>
    <p style="color:#64748B;font-size:14px;text-align:center;line-height:1.6;margin-bottom:24px;">
      Hey <strong>${data.userName}</strong>, reward points have been added to your account!
    </p>
    
    <div class="reward-card">
      <p style="color:#92400E;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Points Added</p>
      <p style="color:#B45309;font-size:42px;font-weight:800;margin:0;">+${data.points}</p>
      <p style="color:#92400E;font-size:13px;margin-top:4px;">${data.reason}</p>
      <p style="color:#92400E;font-size:13px;margin-top:8px;">🪙 New Balance: <strong>${data.totalPoints} points</strong></p>
    </div>
    
    <div style="text-align:center;margin-top:24px;">
      <a href="${BRAND.url}/dashboard/reward" class="btn">Browse Rewards →</a>
    </div>
  `;
  return {
    subject: `🪙 +${data.points} Points Added to Your Account!`,
    html: baseLayout(content, `You earned ${data.points} points! Total: ${data.totalPoints}`),
  };
}

export function getRewardRedeemedEmail(data: RewardRedeemedData): { subject: string; html: string } {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🎁</div>
    </div>
    <h2 style="color:#1E293B;font-size:20px;font-weight:800;text-align:center;margin-bottom:8px;">Reward Redeemed!</h2>
    <p style="color:#64748B;font-size:14px;text-align:center;line-height:1.6;margin-bottom:24px;">
      Congrats <strong>${data.userName}</strong>! You've successfully redeemed a reward.
    </p>
    
    <div class="card" style="text-align:center;border-color:#C4B5FD;background:#F5F3FF;">
      <p style="color:#5B21B6;font-size:16px;font-weight:700;margin-bottom:4px;">🎁 ${data.rewardTitle}</p>
      <p style="color:#7C3AED;font-size:13px;">-${data.pointsSpent} points used</p>
      <p style="color:#6D28D9;font-size:13px;margin-top:8px;">Remaining balance: <strong>${data.remainingPoints} points</strong></p>
    </div>
    
    <div style="text-align:center;margin-top:24px;">
      <a href="${BRAND.url}/dashboard/wallet" class="btn" style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);">View Wallet →</a>
    </div>
  `;
  return {
    subject: `🎁 Reward Redeemed — ${data.rewardTitle}`,
    html: baseLayout(content, `You redeemed ${data.rewardTitle} for ${data.pointsSpent} points.`),
  };
}

export function getWelcomeEmail(data: WelcomeData): { subject: string; html: string } {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,${BRAND.color},${BRAND.colorAccent});border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🌍</div>
    </div>
    <h2 style="color:#1E293B;font-size:22px;font-weight:800;text-align:center;margin-bottom:8px;">Welcome to ${BRAND.name}!</h2>
    <p style="color:#64748B;font-size:14px;text-align:center;line-height:1.6;margin-bottom:24px;">
      Hi <strong>${data.userName}</strong>! You've joined a community of eco-warriors making Telangana cleaner, one recycle at a time.
    </p>
    
    <div style="margin:24px 0;">
      <h3 style="color:#1E293B;font-size:16px;font-weight:700;margin-bottom:16px;">🚀 Here's how to get started:</h3>
      
      <div class="card" style="margin-bottom:12px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;padding-right:12px;">
              <div style="width:32px;height:32px;background:${BRAND.colorLight};border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;">📸</div>
            </td>
            <td>
              <p style="color:#1E293B;font-size:14px;font-weight:600;margin:0;">Scan & Submit</p>
              <p style="color:#64748B;font-size:13px;margin-top:2px;">Take a photo of your recyclable waste and upload it.</p>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="card" style="margin-bottom:12px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;padding-right:12px;">
              <div style="width:32px;height:32px;background:${BRAND.colorLight};border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;">✅</div>
            </td>
            <td>
              <p style="color:#1E293B;font-size:14px;font-weight:600;margin:0;">Get Verified</p>
              <p style="color:#64748B;font-size:13px;margin-top:2px;">Our team reviews and approves your submission.</p>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="card">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;padding-right:12px;">
              <div style="width:32px;height:32px;background:${BRAND.colorLight};border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;">🎁</div>
            </td>
            <td>
              <p style="color:#1E293B;font-size:14px;font-weight:600;margin:0;">Earn Rewards</p>
              <p style="color:#64748B;font-size:13px;margin-top:2px;">Collect points and redeem exciting rewards!</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
    
    <div style="text-align:center;margin-top:24px;">
      <a href="${BRAND.url}/dashboard/home" class="btn">Start Recycling →</a>
    </div>
  `;
  return {
    subject: `🌿 Welcome to ${BRAND.name} — Let's Save the Planet!`,
    html: baseLayout(content, `Welcome to ${BRAND.name}! Start recycling and earning rewards today.`),
  };
}

export function getAnnouncementEmail(data: AnnouncementData): { subject: string; html: string } {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#3B82F6,#1D4ED8);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">📢</div>
    </div>
    <h2 style="color:#1E293B;font-size:20px;font-weight:800;text-align:center;margin-bottom:8px;">${data.title}</h2>
    <div style="color:#475569;font-size:14px;line-height:1.7;margin:20px 0;">
      ${data.message}
    </div>
    
    ${data.ctaText && data.ctaUrl ? `
    <div style="text-align:center;margin-top:24px;">
      <a href="${data.ctaUrl}" class="btn" style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);">${data.ctaText} →</a>
    </div>
    ` : ''}
  `;
  return {
    subject: `📢 ${data.title}`,
    html: baseLayout(content, data.message.substring(0, 100)),
  };
}

export function getWeeklyReportEmail(data: WeeklyReportData): { subject: string; html: string } {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,${BRAND.color},${BRAND.colorAccent});border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">📊</div>
    </div>
    <h2 style="color:#1E293B;font-size:20px;font-weight:800;text-align:center;margin-bottom:8px;">Your Weekly Impact Report</h2>
    <p style="color:#64748B;font-size:14px;text-align:center;line-height:1.6;margin-bottom:24px;">
      Hey <strong>${data.userName}</strong>, here's what you accomplished this week!
    </p>
    
    <div style="display:flex;gap:12px;margin:20px 0;flex-wrap:wrap;justify-content:center;">
      <div class="stat-pill">📸 ${data.submissionsCount} Submissions</div>
      <div class="stat-pill">🪙 +${data.pointsEarned} Points</div>
      ${data.rank ? `<div class="stat-pill">🏆 Rank #${data.rank}</div>` : ''}
    </div>
    
    <div class="card" style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-color:#6EE7B7;text-align:center;">
      <p style="color:#064E3B;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">🌍 Environmental Impact</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:center;padding:8px;">
            <p style="color:#059669;font-size:28px;font-weight:800;margin:0;">${data.co2Saved}kg</p>
            <p style="color:#047857;font-size:12px;margin-top:2px;">CO₂ Saved</p>
          </td>
          <td style="text-align:center;padding:8px;border-left:1px solid #A7F3D0;">
            <p style="color:#059669;font-size:28px;font-weight:800;margin:0;">${data.treesEquivalent}</p>
            <p style="color:#047857;font-size:12px;margin-top:2px;">Trees Equivalent</p>
          </td>
        </tr>
      </table>
    </div>
    
    <div class="reward-card">
      <p style="color:#92400E;font-size:13px;font-weight:600;margin-bottom:4px;">Total Points Balance</p>
      <p style="color:#B45309;font-size:36px;font-weight:800;margin:0;">🪙 ${data.totalPoints}</p>
    </div>
    
    <div style="text-align:center;margin-top:24px;">
      <a href="${BRAND.url}/dashboard/home" class="btn">View Full Dashboard →</a>
    </div>
  `;
  return {
    subject: `📊 Your Weekly Impact — ${data.submissionsCount} submissions, +${data.pointsEarned} pts`,
    html: baseLayout(content, `This week: ${data.submissionsCount} submissions, +${data.pointsEarned} points, ${data.co2Saved}kg CO₂ saved.`),
  };
}

// ── Export all template getters ──
export const emailTemplates = {
  getUploadApprovedEmail,
  getUploadRejectedEmail,
  getRewardPointsEmail,
  getRewardRedeemedEmail,
  getWelcomeEmail,
  getAnnouncementEmail,
  getWeeklyReportEmail,
};
