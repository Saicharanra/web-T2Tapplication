import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getUserNotifications,
  getUnreadCount,
  deleteNotification,
} from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notifications
 * Fetch user's notifications with pagination and filtering.
 * Query params: page, limit, type, unreadOnly
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || undefined;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const result = await getUserNotifications(userId, {
      page,
      limit,
      type,
      unreadOnly,
    });

    const unreadCount = await getUnreadCount(userId);

    return NextResponse.json({
      ...result,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications?id=<notificationId>
 * Delete a notification.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    await deleteNotification(notificationId, userId);

    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
