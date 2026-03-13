import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Helper: Verify the requesting user is an admin
 */
async function verifyAdmin(supabase: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const { data: adminUser, error } = await supabase
    .from("User")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !adminUser) return false;
  return adminUser.role === "ADMIN";
}

/**
 * PUT: Update a reward by ID
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    if (!(await verifyAdmin(supabase, userId))) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const rewardId = parseInt(id);

    if (isNaN(rewardId)) {
      return NextResponse.json({ error: "Invalid reward ID" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, points_required, image_url, status, category, stock } = body;

    // Validation
    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }

    if (points_required !== undefined && (typeof points_required !== "number" || points_required <= 0)) {
      return NextResponse.json({ error: "Points required must be a positive number" }, { status: 400 });
    }

    if (status !== undefined && !["Active", "Inactive"].includes(status)) {
      return NextResponse.json({ error: "Status must be 'Active' or 'Inactive'" }, { status: 400 });
    }

    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
      return NextResponse.json({ error: "Stock must be a non-negative number" }, { status: 400 });
    }

    // Build update object (only include fields that were sent)
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (points_required !== undefined) updateData.points_required = points_required;
    if (image_url !== undefined) updateData.image_url = image_url.trim();
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category.trim();
    if (stock !== undefined) updateData.stock = stock;

    const { data: reward, error } = await supabase
      .from("Rewards")
      .update(updateData)
      .eq("reward_id", rewardId)
      .select()
      .single();

    if (error) {
      console.error("Error updating reward:", error);
      return NextResponse.json(
        { error: "Failed to update reward", details: error.message },
        { status: 500 }
      );
    }

    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    return NextResponse.json({ reward });
  } catch (error) {
    console.error("Error in PUT /api/admin/rewards/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a reward by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    if (!(await verifyAdmin(supabase, userId))) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const rewardId = parseInt(id);

    if (isNaN(rewardId)) {
      return NextResponse.json({ error: "Invalid reward ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("Rewards")
      .delete()
      .eq("reward_id", rewardId);

    if (error) {
      console.error("Error deleting reward:", error);
      return NextResponse.json(
        { error: "Failed to delete reward", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Reward deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/admin/rewards/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
