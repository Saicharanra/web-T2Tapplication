/**
 * Notification service layer.
 * Handles creating, fetching, and managing notifications.
 * Also integrates with the email service for sending email notifications.
 */
import { getSupabaseAdmin } from './supabase';
import { sendEmail } from './email';
import { TABLES } from './db-tables';
import {
  getUploadApprovedEmail,
  getUploadRejectedEmail,
  getRewardPointsEmail,
  getRewardRedeemedEmail,
  getWelcomeEmail,
  getAnnouncementEmail,
} from './email-templates';

// ── Types ──
export type NotificationType =
  | 'UPLOAD_APPROVED'
  | 'UPLOAD_REJECTED'
  | 'REWARD_POINTS'
  | 'REWARD_REDEEMED'
  | 'ACCOUNT_WELCOME'
  | 'ADMIN_ANNOUNCEMENT'
  | 'PICKUP_SCHEDULED'
  | 'PICKUP_COMPLETED'
  | 'CAMPAIGN'
  | 'REFERRAL'
  | 'WEEKLY_REPORT'
  | 'GENERAL';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationResult {
  notification: any;
  emailSent: boolean;
}

// ── Icon Map ──
const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  UPLOAD_APPROVED: '✅',
  UPLOAD_REJECTED: '❌',
  REWARD_POINTS: '🪙',
  REWARD_REDEEMED: '🎁',
  ACCOUNT_WELCOME: '🌿',
  ADMIN_ANNOUNCEMENT: '📢',
  PICKUP_SCHEDULED: '📅',
  PICKUP_COMPLETED: '🚛',
  CAMPAIGN: '🏆',
  REFERRAL: '👥',
  WEEKLY_REPORT: '📊',
  GENERAL: '🔔',
};

// ── Create Notification ──
export async function createNotification(
  params: CreateNotificationParams
): Promise<NotificationResult> {
  const supabase = getSupabaseAdmin();
  const icon = params.icon || NOTIFICATION_ICONS[params.type] || '🔔';

  // Insert notification into database
  const { data: notification, error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .insert({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      icon,
      actionUrl: params.actionUrl || null,
      imageUrl: params.imageUrl || null,
      metadata: params.metadata || {},
      isRead: false,
    })
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [DEBUG] Failed to create notification:', error);
    }
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return { notification, emailSent: false };
}

// ── Create Notification + Send Email ──
export async function createNotificationWithEmail(
  params: CreateNotificationParams & {
    email: string;
    emailSubject: string;
    emailHtml: string;
  }
): Promise<NotificationResult> {
  // Create in-app notification
  const result = await createNotification(params);

  // Check user email preferences
  const supabase = getSupabaseAdmin();
  const { data: prefs } = await supabase
    .from(TABLES.NOTIFICATION_PREFERENCES)
    .select('*')
    .eq('userId', params.userId)
    .single();

  // Determine if email should be sent based on preferences
  let shouldSendEmail = true;
  if (prefs) {
    switch (params.type) {
      case 'UPLOAD_APPROVED':
      case 'UPLOAD_REJECTED':
        shouldSendEmail = prefs.emailUploadStatus;
        break;
      case 'REWARD_POINTS':
      case 'REWARD_REDEEMED':
        shouldSendEmail = prefs.emailRewards;
        break;
      case 'ADMIN_ANNOUNCEMENT':
        shouldSendEmail = prefs.emailAnnouncements;
        break;
      case 'WEEKLY_REPORT':
        shouldSendEmail = prefs.emailWeeklySummary;
        break;
      case 'PICKUP_SCHEDULED':
      case 'PICKUP_COMPLETED':
        shouldSendEmail = prefs.emailPickups;
        break;
      case 'CAMPAIGN':
        shouldSendEmail = prefs.emailCampaigns;
        break;
      default:
        shouldSendEmail = true;
    }
  }

  // Send email if allowed
  if (shouldSendEmail) {
    try {
      const emailResult = await sendEmail({
        to: params.email,
        subject: params.emailSubject,
        html: params.emailHtml,
        userId: params.userId,
        templateType: params.type,
        metadata: params.metadata,
      });
      result.emailSent = emailResult.success;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('⚠️ [DEBUG] Email notification failed:', err);
      }
    }
  }

  return result;
}

// ── High-Level Notification Triggers ──

export async function notifyUploadApproved(params: {
  userId: string;
  userName: string;
  email: string;
  wasteType: string;
  points: number;
  totalPoints: number;
  submissionDate: string;
  location?: string;
}) {
  const emailData = getUploadApprovedEmail({
    userName: params.userName,
    wasteType: params.wasteType,
    points: params.points,
    totalPoints: params.totalPoints,
    submissionDate: params.submissionDate,
    location: params.location,
  });

  return createNotificationWithEmail({
    userId: params.userId,
    type: 'UPLOAD_APPROVED',
    title: 'Upload Approved! 🎉',
    message: `Your ${params.wasteType} submission was verified. +${params.points} points earned!`,
    actionUrl: '/dashboard/wallet',
    metadata: { wasteType: params.wasteType, points: params.points },
    email: params.email,
    emailSubject: emailData.subject,
    emailHtml: emailData.html,
  });
}

export async function notifyUploadRejected(params: {
  userId: string;
  userName: string;
  email: string;
  wasteType: string;
  reason: string;
  submissionDate: string;
}) {
  const emailData = getUploadRejectedEmail({
    userName: params.userName,
    wasteType: params.wasteType,
    reason: params.reason,
    submissionDate: params.submissionDate,
  });

  return createNotificationWithEmail({
    userId: params.userId,
    type: 'UPLOAD_REJECTED',
    title: 'Upload Not Approved',
    message: `Your ${params.wasteType} submission was not approved. ${params.reason}`,
    actionUrl: '/dashboard/scan',
    metadata: { wasteType: params.wasteType, reason: params.reason },
    email: params.email,
    emailSubject: emailData.subject,
    emailHtml: emailData.html,
  });
}

export async function notifyRewardRedeemed(params: {
  userId: string;
  userName: string;
  email: string;
  rewardTitle: string;
  pointsSpent: number;
  remainingPoints: number;
}) {
  const emailData = getRewardRedeemedEmail({
    userName: params.userName,
    rewardTitle: params.rewardTitle,
    pointsSpent: params.pointsSpent,
    remainingPoints: params.remainingPoints,
  });

  return createNotificationWithEmail({
    userId: params.userId,
    type: 'REWARD_REDEEMED',
    title: 'Reward Redeemed! 🎁',
    message: `You redeemed "${params.rewardTitle}" for ${params.pointsSpent} points.`,
    actionUrl: '/dashboard/wallet',
    metadata: { rewardTitle: params.rewardTitle, pointsSpent: params.pointsSpent },
    email: params.email,
    emailSubject: emailData.subject,
    emailHtml: emailData.html,
  });
}

export async function notifyWelcome(params: {
  userId: string;
  userName: string;
  email: string;
}) {
  const emailData = getWelcomeEmail({ userName: params.userName });

  return createNotificationWithEmail({
    userId: params.userId,
    type: 'ACCOUNT_WELCOME',
    title: 'Welcome to Trash2Treasure! 🌿',
    message: 'Start recycling and earn rewards. Scan your first waste item to begin!',
    actionUrl: '/dashboard/home',
    email: params.email,
    emailSubject: emailData.subject,
    emailHtml: emailData.html,
  });
}

export async function notifyAnnouncement(params: {
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}) {
  const supabase = getSupabaseAdmin();

  // Get all active users
  const { data: users, error } = await supabase
    .from(TABLES.USERS)
    .select('id, email, name')
    .eq('status', 'ACTIVE');

  if (error || !users) {
    console.error('Failed to fetch users for announcement:', error);
    return { sent: 0 };
  }

  const emailData = getAnnouncementEmail({
    title: params.title,
    message: params.message,
    ctaText: params.ctaText,
    ctaUrl: params.ctaUrl,
  });

  let sent = 0;
  for (const user of users) {
    try {
      await createNotificationWithEmail({
        userId: user.id,
        type: 'ADMIN_ANNOUNCEMENT',
        title: params.title,
        message: params.message,
        actionUrl: params.ctaUrl,
        email: user.email,
        emailSubject: emailData.subject,
        emailHtml: emailData.html,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to notify user ${user.id}:`, err);
    }
  }

  return { sent, total: users.length };
}

// ── Fetch Notifications ──
export async function getUserNotifications(
  userId: string,
  options: { page?: number; limit?: number; type?: string; unreadOnly?: boolean } = {}
) {
  const supabase = getSupabaseAdmin();
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from(TABLES.NOTIFICATIONS)
    .select('*', { count: 'exact' })
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.unreadOnly) {
    query = query.eq('isRead', false);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return {
    notifications: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

// ── Get Unread Count ──
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();

  const { count, error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId)
    .eq('isRead', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

// ── Mark as Read ──
export async function markAsRead(notificationId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .update({ isRead: true, readAt: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('userId', userId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// ── Mark All as Read ──
export async function markAllAsRead(userId: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .update({ isRead: true, readAt: new Date().toISOString() })
    .eq('userId', userId)
    .eq('isRead', false);

  if (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
}

// ── Delete Notification ──
export async function deleteNotification(notificationId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .delete()
    .eq('id', notificationId)
    .eq('userId', userId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}
