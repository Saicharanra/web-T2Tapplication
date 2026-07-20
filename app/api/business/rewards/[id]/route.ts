import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PUT: Update a business owner's coupon by ID
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

    if (!userId || (userRole !== "BUSINESS" && userRole !== "business")) {
      return NextResponse.json({ error: "Forbidden: Business Owner role required" }, { status: 403 });
    }

    // 1. Verify ownership of reward
    const { data: existingReward, error: fetchError } = await supabaseAdmin
      .from("Reward")
      .select("*")
      .eq("reward_id", rewardId)
      .eq("business_id", userId)
      .maybeSingle();

    if (fetchError || !existingReward) {
      return NextResponse.json({ error: "Reward not found or access denied" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      points_required,
      logo_url,
      banner_url,
      company_name,
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
      status, // 'Active' or 'Inactive' (can be paused/resumed by owner)
      codes // optional codes update
    } = body;

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (points_required !== undefined) updateData.points_required = Number(points_required);
    if (logo_url !== undefined) updateData.logo_url = logo_url.trim();
    if (banner_url !== undefined) {
      updateData.banner_url = banner_url.trim();
      updateData.image_url = banner_url.trim(); // sync fallback
    }
    if (company_name !== undefined) updateData.company_name = company_name.trim();
    if (discount_type !== undefined) updateData.discount_type = discount_type;
    if (discount_value !== undefined) updateData.discount_value = Number(discount_value);
    if (original_price !== undefined) updateData.original_price = original_price ? Number(original_price) : null;
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date ? new Date(expiry_date).toISOString() : null;
    if (min_purchase !== undefined) updateData.min_purchase = Number(min_purchase);
    if (terms !== undefined) updateData.terms = terms.trim();
    if (store_location !== undefined) updateData.store_location = store_location.trim();
    if (website !== undefined) updateData.website = website.trim();
    if (contact_number !== undefined) updateData.contact_number = contact_number.trim();
    if (allow_multiple !== undefined) updateData.allow_multiple = !!allow_multiple;
    
    // Manage status: Owner can only set Active (if approved) or Inactive (Paused). Owner CANNOT bypass admin approval.
    if (status !== undefined) {
      if (status === "Inactive") {
        updateData.status = "Inactive";
      } else if (status === "Active") {
        // Owner wants to resume. But is it suspended by Admin?
        if (existingReward.status === "Suspended") {
          return NextResponse.json({ error: "Cannot activate: Coupon is suspended by Admins" }, { status: 400 });
        }
        // If it was pending approval, keep it pending approval
        if (existingReward.status === "PENDING_APPROVAL") {
          updateData.status = "PENDING_APPROVAL";
        } else {
          updateData.status = "Active";
        }
      }
    }

    // 2. Perform codes update if provided
    if (codes !== undefined) {
      const processedCodes = Array.isArray(codes)
        ? codes.map((c: any) => String(c).trim()).filter(Boolean)
        : typeof codes === "string"
        ? codes.split("\n").map(c => c.trim()).filter(Boolean)
        : [];

      if (processedCodes.length > 0) {
        // Fetch used codes count
        const { data: usedCodes } = await supabaseAdmin
          .from("RewardCode")
          .select("code")
          .eq("reward_id", rewardId)
          .eq("is_used", true);
        
        const usedCount = usedCodes?.length || 0;

        // If they uploaded new codes, delete existing unused codes and replace them
        const { error: deleteUnusedError } = await supabaseAdmin
          .from("RewardCode")
          .delete()
          .eq("reward_id", rewardId)
          .eq("is_used", false);

        if (deleteUnusedError) {
          console.error("Error clearing unused codes:", deleteUnusedError);
        }

        const codesData = processedCodes.map(code => ({
          reward_id: Number(rewardId),
          code,
          is_used: false,
          created_at: new Date().toISOString()
        }));

        const { error: insertCodesError } = await supabaseAdmin
          .from("RewardCode")
          .insert(codesData);

        if (insertCodesError) {
          console.error("Error inserting updated codes:", insertCodesError);
          return NextResponse.json({ error: "Failed to update codes list" }, { status: 500 });
        }

        updateData.max_redemptions = usedCount + processedCodes.length;
        updateData.remaining_redemptions = processedCodes.length;
        updateData.stock = processedCodes.length;
      }
    }

    // 3. Update Reward
    const { data: updatedReward, error: updateError } = await supabaseAdmin
      .from("Reward")
      .update(updateData)
      .eq("reward_id", rewardId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Error updating reward:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Coupon updated successfully!",
      reward: updatedReward
    });

  } catch (error: any) {
    console.error("Error in PUT /api/business/rewards/[id]:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE: Delete a business owner's coupon by ID
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

    if (!userId || (userRole !== "BUSINESS" && userRole !== "business")) {
      return NextResponse.json({ error: "Forbidden: Business Owner role required" }, { status: 403 });
    }

    // 1. Verify ownership
    const { data: existingReward, error: fetchError } = await supabaseAdmin
      .from("Reward")
      .select("reward_id")
      .eq("reward_id", rewardId)
      .eq("business_id", userId)
      .maybeSingle();

    if (fetchError || !existingReward) {
      return NextResponse.json({ error: "Reward not found or access denied" }, { status: 404 });
    }

    // 2. Delete Reward
    const { error: deleteError } = await supabaseAdmin
      .from("Reward")
      .delete()
      .eq("reward_id", rewardId);

    if (deleteError) {
      console.error("Error deleting reward:", deleteError);
      return NextResponse.json({ error: "Failed to delete reward" }, { status: 500 });
    }

    return NextResponse.json({ message: "Reward deleted successfully" });

  } catch (error: any) {
    console.error("Error in DELETE /api/business/rewards/[id]:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
