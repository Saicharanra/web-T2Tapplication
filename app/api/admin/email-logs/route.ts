import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient, getSupabaseAdmin } from '@/lib/supabase';
import { TABLES } from '@/lib/db-tables';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/email-logs
 * Admin: Fetch email logs with pagination and filtering.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    const admin = getSupabaseAdmin();

    let query = admin
      .from(TABLES.EMAIL_LOGS)
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: logs, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch email logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}
