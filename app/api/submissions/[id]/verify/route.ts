import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_WASTE_POINTS: Record<string, number> = {
  "Plastic Bottles": 15,
  "Paper Waste": 10,
  "Metal Cans": 25,
  "Glass Bottles": 20,
  Cardboard: 12,
  "E-Waste": 50,
  "Organic Waste": 18,
  "Mixed Recyclables": 8,
};

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: submissionId } = await props.params;
  try {
    const session = await verifySession(req);

    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { status, rejectionReason } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // 1. Fetch submission
    const { data: submission, error: fetchErr } = await supabaseAdmin
      .from("waste_submissions")
      .select("id, user_id, category, status, points_awarded")
      .eq("id", submissionId)
      .maybeSingle();

    if (fetchErr || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Prevent duplicate verification
    if (submission.status === "VERIFIED" && status === "VERIFIED") {
      return NextResponse.json({
        submission: { id: submissionId, status: "VERIFIED", pointsAwarded: submission.points_awarded },
        message: "Submission was already verified",
      });
    }

    const userId = submission.user_id;
    const wasteType = submission.category;

    // 2. Fetch points config from system_settings
    let pointsConfig: Record<string, number> = DEFAULT_WASTE_POINTS;
    try {
      const { data: settings } = await supabaseAdmin
        .from("system_settings")
        .select("key, value")
        .like("key", "points_%");

      if (settings && settings.length > 0) {
        const cfg: Record<string, number> = {};
        settings.forEach((s: any) => {
          const type = s.key.replace("points_", "").replace(/_/g, " ");
          cfg[type] = Number(s.value) || 0;
        });
        if (Object.keys(cfg).length > 0) pointsConfig = cfg;
      }
    } catch (_) {}

    const pointsToAward = pointsConfig[wasteType] ?? 10;

    // 3. Update submission status
    const updateData: any = {
      status: status.toUpperCase(),
      points_awarded: status === "VERIFIED" ? pointsToAward : 0,
      verified_at: status === "VERIFIED" ? new Date().toISOString() : null,
      assigned_admin_id: session.uid,
      updated_at: new Date().toISOString(),
    };

    if (status === "REJECTED") {
      updateData.rejection_reason = rejectionReason || "No reason provided";
    }

    const { error: updateErr } = await supabaseAdmin
      .from("waste_submissions")
      .update(updateData)
      .eq("id", submissionId);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update submission", details: updateErr.message }, { status: 500 });
    }

    // 4. Award points if VERIFIED
    if (status === "VERIFIED") {
      // Update user points balance
      await supabaseAdmin.rpc("increment_user_points", {
        p_user_id: userId,
        p_points: pointsToAward,
      }).catch(async () => {
        // Fallback: manual update if RPC doesn't exist
        const { data: userRow } = await supabaseAdmin
          .from("users")
          .select("points")
          .eq("id", userId)
          .maybeSingle();
        const currentPoints = Number(userRow?.points) || 0;
        await supabaseAdmin
          .from("users")
          .update({ points: currentPoints + pointsToAward, updated_at: new Date().toISOString() })
          .eq("id", userId);
      });

      // Record in points_history
      await supabaseAdmin.from("points_history").insert({
        user_id: userId,
        submission_id: submissionId,
        points: pointsToAward,
        transaction_type: "EARNED",
        description: `Points earned from ${wasteType || "recycling"}`,
        created_at: new Date().toISOString(),
      }).catch((e: any) => console.warn("⚠️ points_history insert:", e.message));
    }

    // 5. Notifications (in-app)
    try {
      const { data: userProfile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .maybeSingle();

      const email = userProfile?.email || "";
      const name = userProfile?.full_name || "Eco Partner";

      if (status === "VERIFIED") {
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          email,
          type: "submission_approved",
          title: "Submission Approved 🎉",
          message: `Your ${wasteType} submission was approved! ${pointsToAward} points have been added to your account.`,
          read: false,
          created_at: new Date().toISOString(),
        });
      } else if (status === "REJECTED") {
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          email,
          type: "submission_rejected",
          title: "Submission Rejected",
          message: rejectionReason || "Your submission could not be verified. Please review the image and try again.",
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch (notifErr) {
      console.warn("⚠️ Notification insert failed:", notifErr);
    }

    return NextResponse.json({
      submission: { id: submissionId, status, pointsAwarded: status === "VERIFIED" ? pointsToAward : 0 },
      message:
        status === "VERIFIED"
          ? `Submission verified! ${pointsToAward} points awarded.`
          : "Submission rejected.",
    });
  } catch (error: any) {
    const httpStatus = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to verify submission" }, { status: httpStatus });
  }
}
