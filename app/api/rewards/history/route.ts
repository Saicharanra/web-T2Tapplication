import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TABLES } from "@/lib/db-tables";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch redemptions with the associated reward
    const { data: redemptions, error } = await supabase
      .from(TABLES.REWARD_REDEMPTION)
      .select(`
        redemption_id,
        redeemed_at,
        Reward:${TABLES.REWARD}(
          title
        )
      `)
      .eq("user_id", userId)
      .order("redeemed_at", { ascending: false });

    if (error) {
      console.error("Error fetching reward history:", error);
      return NextResponse.json(
        { error: "Failed to fetch reward history" },
        { status: 500 }
      );
    }

    // Transform mapping for the frontend state
    const history = redemptions?.map((r) => {
      const rewardData = (r as unknown as Record<string, unknown>).Reward as Record<string, unknown> | null;
      return {
        id: r.redemption_id,
        name: rewardData ? rewardData.title : "Unknown Reward",
        date: new Date(r.redeemed_at).toISOString().split("T")[0],
        code: `RWD-${String(r.redemption_id).padStart(6, '0')}`,
      };
    }) || [];

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error in GET /api/rewards/history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
