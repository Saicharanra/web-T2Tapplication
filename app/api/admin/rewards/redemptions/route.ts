import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TABLES } from "@/lib/db-tables";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch recent reward redemptions with user and reward info
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Verify admin
    const { data: adminUser, error: adminError } = await supabase
      .from(TABLES.USERS)
      .select("role")
      .eq("id", userId)
      .single();

    if (adminError || !adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Fetch redemptions with reward and user info via joins
    const { data: redemptions, error } = await supabase
      .from(TABLES.REWARD_REDEMPTION)
      .select(`
        redemption_id,
        redeemed_at,
        reward_id,
        user_id,
        Reward:${TABLES.REWARD} (
          title,
          points_required,
          image_url
        ),
        User:${TABLES.USERS}!user_id (
          name,
          email,
          imageUrl
        )
      `)
      .order("redeemed_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching redemptions:", error);

      // Fallback: fetch without joins if the join syntax fails
      const { data: fallbackRedemptions, error: fallbackError } = await supabase
        .from(TABLES.REWARD_REDEMPTION)
        .select("*")
        .order("redeemed_at", { ascending: false })
        .limit(limit);

      if (fallbackError) {
        return NextResponse.json(
          { error: "Failed to fetch redemptions", details: fallbackError.message },
          { status: 500 }
        );
      }

      // Manually join data
      const rewardIds = [...new Set(fallbackRedemptions?.map((r) => r.reward_id) || [])];
      const userIds = [...new Set(fallbackRedemptions?.map((r) => r.user_id) || [])];

      const [rewardsResult, usersResult] = await Promise.all([
        rewardIds.length > 0
          ? supabase.from(TABLES.REWARD).select("reward_id, title, points_required, image_url").in("reward_id", rewardIds)
          : { data: [], error: null },
        userIds.length > 0
          ? supabase.from(TABLES.USERS).select("id, name, email, \"imageUrl\"").in("id", userIds)
          : { data: [], error: null },
      ]);

      const rewardMap = new Map(rewardsResult.data?.map((r) => [r.reward_id, r]) || []);
      const userMap = new Map(usersResult.data?.map((u) => [u.id, u]) || []);

      const enrichedRedemptions = fallbackRedemptions?.map((r) => ({
        ...r,
        reward: rewardMap.get(r.reward_id) || null,
        user: userMap.get(r.user_id) || null,
      })) || [];

      return NextResponse.json({ redemptions: enrichedRedemptions });
    }

    // Transform joined data
    const transformedRedemptions = redemptions?.map((r) => {
      const rewardData = (r as unknown as Record<string, unknown>).Reward as Record<string, unknown> | null;
      const userData = (r as unknown as Record<string, unknown>).User as Record<string, unknown> | null;
      return {
        redemption_id: r.redemption_id,
        reward_id: r.reward_id,
        user_id: r.user_id,
        redeemed_at: r.redeemed_at,
        reward: rewardData ? {
          title: rewardData.title,
          points_required: rewardData.points_required,
          image_url: rewardData.image_url,
        } : null,
        user: userData ? {
          name: userData.name,
          email: userData.email,
          imageUrl: userData.imageUrl,
        } : null,
      };
    }) || [];

    return NextResponse.json({ redemptions: transformedRedemptions });
  } catch (error) {
    console.error("Error in GET /api/admin/rewards/redemptions:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
