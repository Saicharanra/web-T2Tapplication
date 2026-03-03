import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET: Fetch current user's profile statistics
 */
export async function GET(_req: NextRequest) {  // Keep underscore prefix to indicate intentionally unused
  try {
    // Await auth() for Next.js 15 compatibility
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase server client
    const supabase = await createSupabaseServerClient();

    // Get user's total points
    const { data: user } = await supabase
      .from('User')
      .select('points')
      .eq('id', userId)
      .single();

    // Get total submissions count by status
    const { data: submissions } = await supabase
      .from('Submission')
      .select('status, wasteType, createdAt')
      .eq('userId', userId);

    const totalSubmissions = submissions?.length || 0;
    const verifiedSubmissions = submissions?.filter(s => s.status === 'VERIFIED').length || 0;
    const pendingSubmissions = submissions?.filter(s => s.status === 'PENDING').length || 0;
    const rejectedSubmissions = submissions?.filter(s => s.status === 'REJECTED').length || 0;

    // Calculate verification rate
    const verificationRate = totalSubmissions > 0 
      ? Math.round((verifiedSubmissions / totalSubmissions) * 100) 
      : 0;

    // Find most recycled waste type
    const wasteTypeCounts = submissions?.reduce((acc: Record<string, number>, curr) => {
      acc[curr.wasteType] = (acc[curr.wasteType] || 0) + 1;
      return acc;
    }, {});

    const mostRecycled = wasteTypeCounts 
      ? Object.entries(wasteTypeCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0]
      : null;

    const mostRecycledType = mostRecycled ? mostRecycled[0] : 'N/A';
    const mostRecycledCount = mostRecycled ? mostRecycled[1] : 0;

    // Calculate streak (submissions in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSubmissions = submissions?.filter(s => 
      new Date(s.createdAt) >= sevenDaysAgo
    ).length || 0;

    // Get user's rank (simplified - count users with more points)
    const { data: allUsers } = await supabase
      .from('User')
      .select('points')
      .order('points', { ascending: false });

    const userRank = allUsers ? (allUsers.findIndex(u => u.points <= (user?.points || 0)) + 1) : 0;

    return NextResponse.json({
      totalSubmissions,
      verifiedSubmissions,
      pendingSubmissions,
      rejectedSubmissions,
      totalPoints: user?.points || 0,
      mostRecycledType,
      mostRecycledCount,
      streak: recentSubmissions,
      verificationRate,
      rank: userRank,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
