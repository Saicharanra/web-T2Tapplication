import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { TABLES } from '@/lib/db-tables';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/notifications/preferences
 * Fetch user's notification preferences.
 */
export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: prefs, error } = await supabase
      .from(TABLES.NOTIFICATION_PREFERENCES)
      .select('*')
      .eq('userId', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = row not found
      console.error('Error fetching preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Return defaults if no preferences exist
    if (!prefs) {
      return NextResponse.json({
        preferences: {
          emailUploadStatus: true,
          emailRewards: true,
          emailAnnouncements: true,
          emailWeeklySummary: true,
          emailMarketing: false,
          emailPickups: true,
          emailCampaigns: true,
          pushUploadStatus: true,
          pushRewards: true,
          pushAnnouncements: true,
          pushPickups: true,
          pushCampaigns: true,
        },
      });
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error('Error in preferences GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences.
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const body = await req.json();

    // Whitelist allowed fields
    const allowedFields = [
      'emailUploadStatus',
      'emailRewards',
      'emailAnnouncements',
      'emailWeeklySummary',
      'emailMarketing',
      'emailPickups',
      'emailCampaigns',
      'pushUploadStatus',
      'pushRewards',
      'pushAnnouncements',
      'pushPickups',
      'pushCampaigns',
    ];

    const updates: Record<string, boolean> = {};
    for (const key of allowedFields) {
      if (typeof body[key] === 'boolean') {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Upsert preferences
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATION_PREFERENCES)
      .upsert(
        {
          userId,
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: 'userId' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error('Error in preferences PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
