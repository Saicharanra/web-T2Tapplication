import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUnreadCount } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notifications/unread-count
 * Returns the unread notification count for the current user.
 */
export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await getUnreadCount(userId);

    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
