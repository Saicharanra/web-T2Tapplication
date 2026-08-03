import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getUserTotalPoints } from "@/lib/user-points";
import { calculateDailyStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    const userId = session.uid;

    // 1. Get total user points using unified helper
    const { totalPoints } = await getUserTotalPoints(userId);

    // 2. Fetch waste submissions for total count & streak calculation
    const { data: submissions } = await supabaseAdmin
      .from("waste_submissions")
      .select("created_at")
      .eq("user_id", userId);

    const totalSubmissions = submissions ? submissions.length : 0;
    const submissionDates = (submissions || []).map((s: any) => s.created_at).filter(Boolean);
    const streak = calculateDailyStreak(submissionDates);

    // 3. Determine user level tier
    let level = "BRONZE";
    if (totalPoints >= 5000) level = "PLATINUM";
    else if (totalPoints >= 1000) level = "GOLD";
    else if (totalPoints >= 250) level = "SILVER";

    return NextResponse.json({
      totalPoints,
      points: totalPoints,
      level,
      totalSubmissions,
      streak,
    });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch user stats" }, { status });
  }
}
