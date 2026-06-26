import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_WASTE_POINTS: Record<string, number> = {
  "Plastic Bottles": 15,
  "Paper Waste": 10,
  "Metal Cans": 25,
  "Glass Bottles": 20,
  "Cardboard": 12,
  "E-Waste": 50,
  "Organic Waste": 18,
  "Mixed Recyclables": 8
};

const STREAK_BONUSES: Record<number, number> = {
  5: 20,
  10: 50,
  15: 100,
  30: 150
};

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const decodedToken = await verifySession(req);
    const adminUserId = decodedToken.uid;

    if (!adminUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUserDoc = await adminDb.collection("users").doc(adminUserId).get();
    if (!adminUserDoc.exists || !["ADMIN","OWNER"].includes(adminUserDoc.data()?.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { status, points, rejectionReason } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Run transaction
    console.log(`🔄 Starting transaction for submission ${params.id}...`);
    const result = await adminDb.runTransaction(async (transaction) => {
      const submissionRef = adminDb.collection("submissions").doc(params.id);
      const submissionDoc = await transaction.get(submissionRef);

      if (!submissionDoc.exists) {
        console.error(`❌ Submission ${params.id} not found`);
        throw new Error("Submission not found");
      }

      const submissionData = submissionDoc.data()!;
      const userId = submissionData.userId;
      const wasteType = submissionData.wasteType;
      
      // Fetch dynamic points config
      const settingsDoc = await transaction.get(adminDb.collection("settings").doc("pointsConfig"));
      const pointsConfig = settingsDoc.exists ? settingsDoc.data() as Record<string, number> : DEFAULT_WASTE_POINTS;

      // STRICT ENFORCEMENT: Always use the global settings. No manual overrides allowed.
      const pointsToAward = pointsConfig[wasteType] || 10;
      
      if (!userId) {
        console.error(`❌ Submission ${params.id} is corrupted: missing userId`);
        throw new Error("Submission data is corrupted: missing userId");
      }

      // Prevent duplicate verification if status is already set
      if (submissionData.status === 'VERIFIED' && status === 'VERIFIED') {
        console.warn(`⚠️ Submission ${params.id} is already verified.`);
        return {
          id: params.id,
          status: submissionData.status,
          pointsAwarded: submissionData.pointsAwarded,
          message: "Submission was already verified"
        };
      }

      // --- ALL READS MUST HAPPEN HERE ---
      let userDoc = null;
      let userRef = null;
      if (status === 'VERIFIED') {
        userRef = adminDb.collection("users").doc(userId);
        userDoc = await transaction.get(userRef);
      }
      // --- END OF READS ---

      // --- ALL WRITES MUST HAPPEN HERE ---
      console.log(`📝 Updating submission status to ${status} for user ${userId} with ${pointsToAward} points`);

      // Update submission data defensively
      const updateData: any = {
        status,
        pointsAwarded: status === 'VERIFIED' ? pointsToAward : 0,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        assignedAdminId: adminUserId || 'system',
        updatedAt: new Date(),
      };

      if (status === 'REJECTED') {
        updateData.rejectionReason = rejectionReason || 'No reason provided';
      }

      transaction.update(submissionRef, updateData);

      if (status === 'VERIFIED' && userRef && userDoc) {
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          const currentPoints = Number(userData.points) || 0;
          const newPoints = currentPoints + pointsToAward;
          
          console.log(`💰 Awarding ${pointsToAward} points to user ${userId}. New total: ${newPoints}`);
          
          transaction.update(userRef, { 
            points: newPoints,
            updatedAt: new Date()
          });

          // Create points history record
          const historyRef = adminDb.collection("pointsHistory").doc();
          transaction.set(historyRef, {
            userId: userId,
            submissionId: params.id,
            points: pointsToAward,
            description: `Points earned from ${wasteType || 'recycling'}`,
            type: 'EARNED',
            createdAt: new Date(),
          });
        } else {
          console.warn(`⚠️ User ${userId} not found in database. Skipping point award.`);
        }
      }

      return {
        id: params.id,
        status,
        pointsAwarded: status === 'VERIFIED' ? pointsToAward : 0,
      };
    });

    console.log(`✅ Transaction completed for ${params.id}`);

    // Dynamic Coordinated Notifications (In-App + Transactional Resend Emails)
    try {
      const submissionDoc = await adminDb.collection("submissions").doc(params.id).get();
      const submissionData = submissionDoc.data();
      
      if (submissionData) {
        const userId = submissionData.userId;
        const userDoc = await adminDb.collection("users").doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        if (userData && userData.email) {
          const email = userData.email;
          const name = userData.name || "Eco Partner";
          const wasteType = submissionData.wasteType || "Waste Disposal";
          const { sendEmail } = await import("@/lib/notifications/sendEmail");

          if (status === "VERIFIED") {
            // A: Log In-App Notification
            await adminDb.collection("notifications").add({
              userId,
              email,
              type: "submission_approved",
              title: "Submission Approved",
              message: "Congratulations! Your submission has been approved and reward points have been added to your account.",
              read: false,
              createdAt: new Date(),
            });

            // B: Send Resend Email
            await sendEmail(email, "Disposal Submission Approved 🎉", "approved", {
              name,
              wasteType,
              points: result.pointsAwarded,
            });
          } else if (status === "REJECTED") {
            const reason = rejectionReason || "Your submission could not be verified. Please review the image and try again.";

            // A: Log In-App Notification
            await adminDb.collection("notifications").add({
              userId,
              email,
              type: "submission_rejected",
              title: "Submission Rejected",
              message: "Your submission could not be verified. Please review the image and try again.",
              read: false,
              createdAt: new Date(),
            });

            // B: Send Resend Email
            await sendEmail(email, "Disposal Submission Update", "rejected", {
              name,
              wasteType,
              reason,
            });
          }
        }
      }
    } catch (notifErr) {
      console.error("⚠️ Failed to dispatch post-transaction notifications:", notifErr);
    }

    return NextResponse.json({
      submission: result,
      message: status === 'VERIFIED' 
        ? `Submission verified! ${result.pointsAwarded} points awarded.`
        : 'Submission rejected.'
    }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error in verify route:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to verify submission", details: error.message },
      { status: 500 }
    );
  }
}
