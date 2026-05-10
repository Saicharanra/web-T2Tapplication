import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient, getSupabaseAdmin } from '@/lib/supabase';
import { notifyAnnouncement, createNotification } from '@/lib/notifications';
import { TABLES } from '@/lib/db-tables';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/notifications
 * Admin: Send broadcast announcement or targeted notification.
 * Body: { type: 'broadcast' | 'targeted', title, message, ctaText?, ctaUrl?, targetUserId? }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const supabase = await createSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Safe JSON parsing
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 });
    }

    const { type, title, message, ctaText, ctaUrl, targetUserId } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    if (type === 'broadcast') {
      // Send to all users
      const result = await notifyAnnouncement({
        title,
        message,
        ctaText,
        ctaUrl,
      });

      return NextResponse.json({
        message: `Broadcast sent to ${result.sent}/${result.total} users`,
        ...result,
      });
    }

    if (type === 'targeted' && targetUserId) {
      // Send to specific user
      await createNotification({
        userId: targetUserId,
        type: 'ADMIN_ANNOUNCEMENT',
        title,
        message,
        actionUrl: ctaUrl,
      });

      return NextResponse.json({
        message: `Notification sent to user ${targetUserId}`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "broadcast" or "targeted"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in admin notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/notifications
 * Admin: Get notification analytics.
 */
export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: user } = await supabase
      .from(TABLES.USERS)
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const admin = getSupabaseAdmin();

    // Get notification stats
    const { data: notifications, error: nError } = await admin
      .from(TABLES.NOTIFICATIONS)
      .select('type, isRead');

    const { data: emailLogs, error: eError } = await admin
      .from(TABLES.EMAIL_LOGS)
      .select('status, templateType, createdAt')
      .order('createdAt', { ascending: false })
      .limit(100);

    if (nError || eError) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Compute analytics
    const notifsByType: Record<string, number> = {};
    let totalNotifs = 0;
    let readNotifs = 0;

    for (const n of notifications || []) {
      totalNotifs++;
      if (n.isRead) readNotifs++;
      notifsByType[n.type] = (notifsByType[n.type] || 0) + 1;
    }

    const emailsByStatus: Record<string, number> = {};
    for (const e of emailLogs || []) {
      emailsByStatus[e.status] = (emailsByStatus[e.status] || 0) + 1;
    }

    return NextResponse.json({
      notifications: {
        total: totalNotifs,
        read: readNotifs,
        unread: totalNotifs - readNotifs,
        byType: notifsByType,
      },
      emails: {
        total: emailLogs?.length || 0,
        byStatus: emailsByStatus,
        recentLogs: (emailLogs || []).slice(0, 20),
      },
    });
  } catch (error) {
    console.error('Error in admin notification analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
