import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET: Fetch user statistics
 * Returns: totalPoints, level, totalSubmissions, streak
 */
export async function GET(_req: NextRequest) {  // Keep underscore prefix to indicate intentionally unused
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase server client
    const supabase = await createSupabaseServerClient();

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('points, level')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Get total submissions count
    const { count: totalSubmissions, error: countError } = await supabase
      .from('Submission')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId);

    if (countError) {
      console.error('Submissions count error:', countError);
    }

    // Calculate streak (simplified - count submissions in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentCount } = await supabase
      .from('Submission')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .gte('createdAt', sevenDaysAgo.toISOString());

    return NextResponse.json({
      totalPoints: user?.points || 0,
      level: user?.level || 'BRONZE',
      totalSubmissions: totalSubmissions || 0,
      streak: recentCount || 0,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
