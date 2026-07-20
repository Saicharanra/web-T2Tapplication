import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PUT: Approve or Suspend a coupon campaign by ID
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
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body; // "APPROVE" | "SUSPEND" | "REJECT"

    if (!action || !["APPROVE", "SUSPEND", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Expected APPROVE, SUSPEND, or REJECT." }, { status: 400 });
    }

    let nextStatus: string;
    if (action === "APPROVE") nextStatus = "Active";
    else if (action === "SUSPEND") nextStatus = "Suspended";
    else nextStatus = "Inactive"; // Rejected

    const { data: updatedReward, error: updateError } = await supabaseAdmin
      .from("Reward")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq("reward_id", rewardId)
      .select("*")
      .single();

    if (updateError || !updatedReward) {
      console.error("Error approving reward:", updateError);
      return NextResponse.json({ error: "Failed to update coupon status" }, { status: 500 });
    }

    // Send notification to the owning business owner
    if (updatedReward.business_id) {
      try {
        await supabaseAdmin
          .from("Notification")
          .insert({
            userId: updatedReward.business_id,
            email: "",
            type: "coupon_status_changed",
            title: `Coupon ${action === 'APPROVE' ? 'Approved' : action === 'SUSPEND' ? 'Suspended' : 'Rejected'} 🎟️`,
            message: `Your coupon campaign "${updatedReward.title}" has been ${action === 'APPROVE' ? 'approved and is now active!' : action === 'SUSPEND' ? 'suspended.' : 'rejected.'}`,
            read: false,
            createdAt: new Date().toISOString()
          });
      } catch (notifErr) {
        console.warn("Notification insert failed:", notifErr);
      }
    }

    return NextResponse.json({
      message: `Coupon successfully updated with status: ${nextStatus}!`,
      reward: updatedReward
    });

  } catch (error: any) {
    console.error("Error in PUT /api/admin/rewards/[id]/approve:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
