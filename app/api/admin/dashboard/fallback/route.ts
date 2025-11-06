import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fallback dashboard data when main API fails
 */
export async function GET(_req: NextRequest) {  // Add underscore prefix to indicate intentionally unused
  console.log('🔍 Admin dashboard FALLBACK API called');
  
  // Return default/fallback data
  return NextResponse.json({
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      newThisWeek: 0,
      topContributors: 0,
      recentSubmissions: 0,
      totalPoints: 0,
    },
    users: [],
  });
}