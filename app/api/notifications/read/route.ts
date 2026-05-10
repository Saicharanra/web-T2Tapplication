import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markAsRead, markAllAsRead } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/notifications/read
 * Body: { notificationId?: string, all?: boolean }
 * Mark single notification or all notifications as read.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, all } = body;

    if (all) {
      await markAllAsRead(userId);
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId or all=true is required' },
        { status: 400 }
      );
    }

    await markAsRead(notificationId, userId);
    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
