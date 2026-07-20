import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch all rewards with redemption counts for Admins
 * Query params: ?search=, ?status=, ?category=
 */
export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role;

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";

    // 1. Fetch all rewards
    let query = supabaseAdmin.from("Reward").select("*");

    if (status && status !== "All") {
      query = query.eq("status", status);
    }

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    const { data: rewards, error: rewardsError } = await query.order("created_at", { ascending: false });

    if (rewardsError) {
      console.error("Error fetching rewards:", rewardsError);
      return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
    }

    // 2. Fetch redemptions count to enhance rewards
    const { data: redemptions, error: redemptionsError } = await supabaseAdmin
      .from("RewardRedemption")
      .select("reward_id, redemption_id");

    if (redemptionsError) {
      console.error("Error fetching redemptions count:", redemptionsError);
    }

    // Build redemption count map
    const redemptionMap = new Map<number, number>();
    (redemptions || []).forEach((r: any) => {
      redemptionMap.set(r.reward_id, (redemptionMap.get(r.reward_id) || 0) + 1);
    });

    // Enhance rewards with redemption counts
    const enhancedRewards = (rewards || []).map((reward: any) => ({
      ...reward,
      redemptions: redemptionMap.get(reward.reward_id) || 0,
    }));

    // Stats
    const totalRewards = enhancedRewards.length;
    const activeRewards = enhancedRewards.filter((r: any) => r.status === "Active").length;
    const totalRedemptions = redemptions?.length || 0;

    return NextResponse.json({
      rewards: enhancedRewards,
      stats: {
        totalRewards,
        activeRewards,
        totalRedemptions,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/rewards:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST: Create a new reward (Admin general creation)
 */
export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role;

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, points_required, image_url, status, category, stock, codes } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!points_required || typeof points_required !== "number" || points_required <= 0) {
      return NextResponse.json({ error: "Points required must be a positive number" }, { status: 400 });
    }

    const processedCodes = Array.isArray(codes)
      ? codes.map((c: any) => String(c).trim()).filter(Boolean)
      : [];

    if (processedCodes.length === 0) {
      return NextResponse.json({ error: "At least one coupon code is required" }, { status: 400 });
    }

    const finalStock = processedCodes.length;

    // Insert Reward
    const { data: reward, error: insertError } = await supabaseAdmin
      .from("Reward")
      .insert({
        title: title.trim(),
        description: description?.trim() || "",
        points_required,
        image_url: image_url?.trim() || "🎁",
        status: status || "Active",
        category: category?.trim() || "General",
        stock: finalStock,
        max_redemptions: finalStock,
        remaining_redemptions: finalStock,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (insertError || !reward) {
      console.error("Error inserting reward:", insertError);
      return NextResponse.json({ error: insertError?.message || "Failed to create reward" }, { status: 500 });
    }

    // Insert Codes
    const codesData = processedCodes.map(code => ({
      reward_id: reward.reward_id,
      code,
      is_used: false,
      created_at: new Date().toISOString()
    }));

    const { error: codesError } = await supabaseAdmin
      .from("RewardCode")
      .insert(codesData);

    if (codesError) {
      console.error("Error inserting codes:", codesError);
      // Rollback
      await supabaseAdmin.from("Reward").delete().eq("reward_id", reward.reward_id);
      return NextResponse.json({ error: "Failed to securely save codes" }, { status: 500 });
    }

    return NextResponse.json({
      reward
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error in POST /api/admin/rewards:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
