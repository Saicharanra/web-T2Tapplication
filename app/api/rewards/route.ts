import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch all active rewards for public catalog
 * EXCLUDES confidential coupon codes
 */
export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch active rewards
    const { data: rewards, error } = await supabaseAdmin
      .from("Reward")
      .select(`
        reward_id,
        title,
        description,
        points_required,
        image_url,
        status,
        category,
        stock,
        company_name,
        logo_url,
        banner_url,
        discount_type,
        discount_value,
        original_price,
        expiry_date,
        min_purchase,
        terms,
        store_location,
        website,
        contact_number,
        allow_multiple,
        remaining_redemptions
      `)
      .eq("status", "Active")
      .order("points_required", { ascending: true });

    if (error) {
      console.error("Error fetching rewards:", error);
      return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
    }

    return NextResponse.json({ rewards: rewards || [] });
  } catch (error: any) {
    console.error("Error in GET /api/rewards:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST: Redeem a reward (Secure Transaction with Optimistic Concurrency Locking)
 */
export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reward_id: rewardId } = body;

    if (!rewardId) {
      return NextResponse.json({ error: "reward_id is required" }, { status: 400 });
    }

    // 1. Fetch User details
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("points, email, name")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch Reward details
    const { data: reward, error: rewardError } = await supabaseAdmin
      .from("Reward")
      .select("*")
      .eq("reward_id", rewardId)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    // 3. Validation Checks
    if (reward.status !== "Active") {
      return NextResponse.json({ error: "Reward is not currently active" }, { status: 400 });
    }

    if (reward.expiry_date && new Date(reward.expiry_date) < new Date()) {
      return NextResponse.json({ error: "Reward campaign has expired" }, { status: 400 });
    }

    if (reward.remaining_redemptions <= 0) {
      return NextResponse.json({ error: "Reward is out of stock" }, { status: 400 });
    }

    if (user.points < reward.points_required) {
      return NextResponse.json({ error: "Insufficient Green Points" }, { status: 400 });
    }

    // Check duplicate redemptions if allow_multiple is false
    if (!reward.allow_multiple) {
      const { data: existingRedemption } = await supabaseAdmin
        .from("RewardRedemption")
        .select("redemption_id")
        .eq("user_id", userId)
        .eq("reward_id", rewardId)
        .maybeSingle();

      if (existingRedemption) {
        return NextResponse.json({ error: "You have already redeemed this reward" }, { status: 400 });
      }
    }

    // 4. Optimistic locking: Find an unused code
    const { data: codeRows, error: codeFetchError } = await supabaseAdmin
      .from("RewardCode")
      .select("id, code")
      .eq("reward_id", rewardId)
      .eq("is_used", false)
      .limit(1);

    if (codeFetchError || !codeRows || codeRows.length === 0) {
      return NextResponse.json({ error: "Reward is out of stock (no codes left)" }, { status: 400 });
    }

    const selectedCodeRow = codeRows[0];

    // 5. Try to lock/claim the selected code
    const { data: claimedCode, error: claimError } = await supabaseAdmin
      .from("RewardCode")
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq("id", selectedCodeRow.id)
      .eq("is_used", false)
      .select("code")
      .single();

    if (claimError || !claimedCode) {
      return NextResponse.json({ error: "Failed to claim reward. Please try again." }, { status: 409 });
    }

    const redemptionCode = claimedCode.code;

    // 6. Deduct Points from User
    const newPoints = user.points - reward.points_required;
    const { error: userUpdateError } = await supabaseAdmin
      .from("users")
      .update({ points: newPoints, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (userUpdateError) {
      // Rollback the code claim
      await supabaseAdmin.from("RewardCode").update({ is_used: false, used_by: null, used_at: null }).eq("id", selectedCodeRow.id);
      return NextResponse.json({ error: "Failed to update points balance" }, { status: 500 });
    }

    // 7. Decrement remaining redemptions
    const newRemaining = Math.max(0, reward.remaining_redemptions - 1);
    await supabaseAdmin
      .from("Reward")
      .update({ remaining_redemptions: newRemaining, stock: newRemaining })
      .eq("reward_id", rewardId);

    // 8. Create Redemption Record
    const expiryDate = reward.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days
    const { data: redemption, error: redemptionError } = await supabaseAdmin
      .from("RewardRedemption")
      .insert({
        user_id: userId,
        reward_id: rewardId,
        code_id: selectedCodeRow.id,
        code: redemptionCode,
        redeemed_at: new Date().toISOString(),
        expires_at: expiryDate,
        status: "ACTIVE"
      })
      .select("redemption_id")
      .single();

    if (redemptionError || !redemption) {
      console.error("Redemption insert error:", redemptionError);
    }

    // 9. Add points_history Record
    await supabaseAdmin
      .from("points_history")
      .insert({
        user_id: userId,
        points: -reward.points_required,
        transaction_type: "REDEEMED",
        description: `Redeemed for ${reward.title}`,
        created_at: new Date().toISOString()
      });

    // 10. In-App Notification (optional helper)
    try {
      await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: userId,
          email: user.email,
          type: "reward_claimed",
          title: "Reward Claimed 🪙",
          message: `Your reward claim for "${reward.title}" has been completed successfully! Code: ${redemptionCode}`,
          read: false,
          created_at: new Date().toISOString()
        });
    } catch (notifErr) {
      console.warn("Notification insert failed:", notifErr);
    }

    return NextResponse.json({
      message: "Reward redeemed successfully!",
      newPoints,
      redemption_id: redemption?.redemption_id,
      code: redemptionCode,
      reward: {
        title: reward.title,
        points_required: reward.points_required
      }
    });

  } catch (error: any) {
    console.error("Error in POST /api/rewards:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
