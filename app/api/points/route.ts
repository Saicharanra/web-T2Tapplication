import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getUserTotalPoints } from "@/lib/user-points";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    const userId = session.uid;

    const { totalPoints, historyEarned } = await getUserTotalPoints(userId);

    // Fetch points history for record count
    const { data: history } = await supabaseAdmin
      .from("points_history")
      .select("points, transaction_type, created_at")
      .eq("user_id", userId);

    const avgPoints = (history || []).length > 0 ? totalPoints / (history || []).length : 0;

    return NextResponse.json({
      totalPoints,
      points: totalPoints,
      avgPoints: Math.round(avgPoints),
      topEarner: null,
    });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch points statistics" }, { status });
  }
}
