import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PUT: Update a reward by ID (Admin)
 */
export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id: rewardId } = params;

  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role;

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, points_required, image_url, status, category, stock, codes } = body;

    // Validation
    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }

    if (points_required !== undefined && (typeof points_required !== "number" || points_required <= 0)) {
      return NextResponse.json({ error: "Points required must be a positive number" }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (points_required !== undefined) updateData.points_required = points_required;
    if (image_url !== undefined) updateData.image_url = image_url.trim();
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category.trim();

    if (codes !== undefined) {
      const processedCodes = Array.isArray(codes)
        ? codes.map((c: any) => String(c).trim()).filter(Boolean)
        : [];
      
      if (processedCodes.length > 0) {
        // Clear unused codes
        await supabaseAdmin
          .from("RewardCode")
          .delete()
          .eq("reward_id", rewardId)
          .eq("is_used", false);

        const codesData = processedCodes.map(code => ({
          reward_id: Number(rewardId),
          code,
          is_used: false,
          created_at: new Date().toISOString()
        }));

        await supabaseAdmin.from("RewardCode").insert(codesData);
        updateData.stock = processedCodes.length;
        updateData.max_redemptions = processedCodes.length;
        updateData.remaining_redemptions = processedCodes.length;
      }
    } else if (stock !== undefined) {
      updateData.stock = stock;
    }

    const { data: updatedReward, error } = await supabaseAdmin
      .from("Reward")
      .update(updateData)
      .eq("reward_id", rewardId)
      .select("*")
      .single();

    if (error || !updatedReward) {
      console.error("Error updating reward:", error);
      return NextResponse.json({ error: "Reward not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({ reward: updatedReward });

  } catch (error: any) {
    console.error("Error in PUT /api/admin/rewards/[id]:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE: Delete a reward by ID (Admin)
 */
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id: rewardId } = params;

  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role;

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from("Reward")
      .delete()
      .eq("reward_id", rewardId);

    if (error) {
      console.error("Error deleting reward:", error);
      return NextResponse.json({ error: "Failed to delete reward" }, { status: 500 });
    }

    return NextResponse.json({ message: "Reward deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/admin/rewards/[id]:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
