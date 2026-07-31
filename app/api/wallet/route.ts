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

    // 1. Fetch unified total points
    const { totalPoints, historyEarned, historyRedeemed } = await getUserTotalPoints(userId);

    // 2. Fetch points history with error resilience
    let transactions: any[] = [];
    try {
      const { data: history } = await supabaseAdmin
        .from("points_history")
        .select("id, points, transaction_type, description, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      transactions = (history || []).map((row: any) => ({
        id: row.id,
        points: Number(row.points) || 0,
        description: row.description || "Points from recycling",
        type: row.transaction_type,
        createdAt: row.created_at,
      }));
    } catch (_) {}

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const thisMonthPoints = transactions
      .filter((t: any) => {
        const d = new Date(t.createdAt);
        return d >= firstDayOfMonth && (t.type === "EARNED" || t.type === "BONUS" || t.type === "WASTE_VERIFIED");
      })
      .reduce((sum: number, t: any) => sum + t.points, 0);

    return NextResponse.json({
      totalPoints,
      points: totalPoints,
      thisMonthPoints,
      totalEarned: historyEarned || totalPoints,
      totalRedeemed: historyRedeemed,
      transactions,
    });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch wallet data" }, { status });
  }
}
