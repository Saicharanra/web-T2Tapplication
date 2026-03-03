import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {  // Keep underscore prefix to indicate intentionally unused
  try {
    // Await auth() for Next.js 15 compatibility
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase client
    const supabase = await createSupabaseServerClient();

    // Fetch total points
    const { data: pointsHistory, error: pointsError } = await supabase
      .from('PointsHistory')
      .select('points');

    if (pointsError) {
      throw new Error(`Failed to fetch points history: ${pointsError.message}`);
    }

    const totalPoints = pointsHistory.reduce((sum, record) => sum + record.points, 0);

    // Calculate average points
    const avgPoints = pointsHistory.length > 0 ? totalPoints / pointsHistory.length : 0;

    // Find top earner
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('name, points')
      .order('points', { ascending: false })
      .limit(1);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    const topEarner = users && users.length > 0 ? users[0] : null;

    return NextResponse.json({
      totalPoints: totalPoints || 0,
      avgPoints: Math.round(avgPoints || 0),
      topEarner,
    });
  } catch (error) {
    console.error("Error fetching points stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch points statistics" },
      { status: 500 }
    );
  }
}