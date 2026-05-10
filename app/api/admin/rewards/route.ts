import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TABLES } from "@/lib/db-tables";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Helper: Verify the requesting user is an admin
 */
async function verifyAdmin(supabase: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const { data: adminUser, error } = await supabase
    .from(TABLES.USERS)
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !adminUser) return false;
  return adminUser.role === "ADMIN";
}

/**
 * GET: Fetch all rewards with redemption counts
 * Query params: ?search=, ?status=, ?category=
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    if (!(await verifyAdmin(supabase, userId))) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";

    // Fetch all rewards
    let query = supabase
      .from(TABLES.REWARD)
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "All") {
      query = query.eq("status", status);
    }

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: rewards, error: rewardsError } = await query;

    if (rewardsError) {
      console.error("Error fetching rewards:", rewardsError);
      return NextResponse.json(
        { error: "Failed to fetch rewards", details: rewardsError.message },
        { status: 500 }
      );
    }

    // Fetch redemption counts per reward
    const { data: redemptions, error: redemptionsError } = await supabase
      .from(TABLES.REWARD_REDEMPTION)
      .select("reward_id");

    if (redemptionsError) {
      console.error("Error fetching redemptions:", redemptionsError);
    }

    // Build redemption count map
    const redemptionMap = new Map<number, number>();
    redemptions?.forEach((r) => {
      redemptionMap.set(r.reward_id, (redemptionMap.get(r.reward_id) || 0) + 1);
    });

    // Enhance rewards with redemption counts
    const enhancedRewards = rewards?.map((reward) => ({
      ...reward,
      redemptions: redemptionMap.get(reward.reward_id) || 0,
    })) || [];

    // Stats
    const totalRewards = enhancedRewards.length;
    const activeRewards = enhancedRewards.filter((r) => r.status === "Active").length;
    const totalRedemptions = enhancedRewards.reduce((sum, r) => sum + r.redemptions, 0);

    return NextResponse.json({
      rewards: enhancedRewards,
      stats: {
        totalRewards,
        activeRewards,
        totalRedemptions,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/rewards:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new reward
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    if (!(await verifyAdmin(supabase, userId))) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Safe JSON parsing
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 });
    }

    const { title, description, points_required, image_url, status, category, stock } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!points_required || typeof points_required !== "number" || points_required <= 0) {
      return NextResponse.json({ error: "Points required must be a positive number" }, { status: 400 });
    }

    if (status && !["Active", "Inactive"].includes(status)) {
      return NextResponse.json({ error: "Status must be 'Active' or 'Inactive'" }, { status: 400 });
    }

    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
      return NextResponse.json({ error: "Stock must be a non-negative number" }, { status: 400 });
    }

    const { data: reward, error } = await supabase
      .from(TABLES.REWARD)
      .insert({
        title: title.trim(),
        description: description?.trim() || "",
        points_required,
        image_url: image_url?.trim() || "🎁",
        status: status || "Active",
        category: category?.trim() || "General",
        stock: stock ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating reward:", error);
      return NextResponse.json(
        { error: "Failed to create reward", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/rewards:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
