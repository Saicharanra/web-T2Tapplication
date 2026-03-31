import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch all active rewards for the user-facing rewards page
 * This endpoint is available to all authenticated users (not admin-only)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch only active rewards
    const { data: rewards, error } = await supabase
      .from("Reward")
      .select("reward_id, title, description, points_required, image_url, status, category, stock")
      .eq("status", "Active")
      .order("points_required", { ascending: true });

    if (error) {
      console.error("Error fetching rewards:", error);
      return NextResponse.json(
        { error: "Failed to fetch rewards", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rewards: rewards || [] });
  } catch (error) {
    console.error("Error in GET /api/rewards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST: Redeem a reward (deduct points + record redemption)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { reward_id } = body;

    if (!reward_id) {
      return NextResponse.json({ error: "reward_id is required" }, { status: 400 });
    }

    // Fetch the reward
    const { data: reward, error: rewardError } = await supabase
      .from("Reward")
      .select("*")
      .eq("reward_id", reward_id)
      .eq("status", "Active")
      .single();

    if (rewardError || !reward) {
      return NextResponse.json({ error: "Reward not found or inactive" }, { status: 404 });
    }

    // Check stock
    if (reward.stock <= 0 && reward.stock !== 999) {
      return NextResponse.json({ error: "Reward is out of stock" }, { status: 400 });
    }

    // Fetch user's current points
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("points")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.points < reward.points_required) {
      return NextResponse.json({
        error: "Insufficient points",
        required: reward.points_required,
        current: user.points,
      }, { status: 400 });
    }

    // Deduct points from user
    const { error: deductError } = await supabase
      .from("User")
      .update({ points: user.points - reward.points_required })
      .eq("id", userId);

    if (deductError) {
      console.error("Error deducting points:", deductError);
      return NextResponse.json({ error: "Failed to deduct points" }, { status: 500 });
    }

    // Record redemption
    const { data: redemptionData, error: redemptionError } = await supabase
      .from("RewardRedemption")
      .insert({
        reward_id: reward.reward_id,
        user_id: userId,
      })
      .select("redemption_id")
      .single();

    if (redemptionError) {
      console.error("Error recording redemption:", redemptionError);
      // Attempt to refund points
      await supabase
        .from("User")
        .update({ points: user.points })
        .eq("id", userId);
      return NextResponse.json({ error: "Failed to record redemption" }, { status: 500 });
    }

    // Decrease stock (if not unlimited)
    if (reward.stock !== 999) {
      await supabase
        .from("Reward")
        .update({ stock: reward.stock - 1 })
        .eq("reward_id", reward.reward_id);
    }

    return NextResponse.json({
      message: "Reward redeemed successfully!",
      newPoints: user.points - reward.points_required,
      redemption_id: redemptionData?.redemption_id,
      reward: {
        title: reward.title,
        points_required: reward.points_required,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/rewards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
