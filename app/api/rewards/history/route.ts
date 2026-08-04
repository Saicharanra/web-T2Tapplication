import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch redeemed rewards for the logged-in user
 */
export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let historyList: any[] = [];

    // Attempt 1: Query coupon_redemptions
    try {
      const { data } = await supabaseAdmin
        .from("coupon_redemptions")
        .select("*")
        .eq("user_id", userId)
        .order("redeemed_at", { ascending: false });

      if (data && data.length > 0) {
        historyList = data.map((r: any) => ({
          id: String(r.id),
          reward_id: String(r.coupon_id || r.id),
          name: "Discount Coupon",
          description: `Redeemed coupon for ${r.points_spent || 0} credits`,
          image_url: "🎟️",
          category: "Gift Cards",
          points_required: r.points_spent || 0,
          date: r.redeemed_at ? r.redeemed_at.split("T")[0] : new Date().toISOString().split("T")[0],
          code: r.redemption_code || "CODE-EXPIRED",
          status: r.status || "ACTIVE"
        }));
      }
    } catch (_) {}

    // Attempt 2: Query redemption_requests if empty
    if (historyList.length === 0) {
      try {
        const { data } = await supabaseAdmin
          .from("redemption_requests")
          .select("*, rewards(*)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          historyList = data.map((r: any) => ({
            id: String(r.id),
            reward_id: String(r.reward_id),
            name: r.rewards?.title || "Eco Reward",
            description: r.rewards?.description || "",
            image_url: r.rewards?.image_url || "🎁",
            category: r.rewards?.category || "General",
            points_required: r.points_spent || r.rewards?.points_required || 0,
            date: r.created_at ? r.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            code: r.voucher_code || "ACTIVE",
            status: r.status || "Approved"
          }));
        }
      } catch (_) {}
    }

    // Attempt 3: Query RewardRedemption if empty
    if (historyList.length === 0) {
      try {
        const { data } = await supabaseAdmin
          .from("RewardRedemption")
          .select("*, Reward(*)")
          .eq("user_id", userId)
          .order("redeemed_at", { ascending: false });

        if (data && data.length > 0) {
          historyList = data.map((r: any) => {
            const reward = r.Reward || {};
            return {
              id: String(r.redemption_id || r.id),
              reward_id: String(r.reward_id),
              name: reward.title || "Eco Reward",
              description: reward.description || "",
              image_url: reward.image_url || "🎁",
              category: reward.category || "General",
              points_required: reward.points_required || 0,
              date: r.redeemed_at ? r.redeemed_at.split("T")[0] : new Date().toISOString().split("T")[0],
              code: r.code || "ACTIVE",
              status: r.status || "ACTIVE"
            };
          });
        }
      } catch (_) {}
    }

    return NextResponse.json({ history: historyList });
  } catch (error: any) {
    console.error("Error in GET /api/rewards/history:", error);
    if (error.message?.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ history: [] });
  }
}

