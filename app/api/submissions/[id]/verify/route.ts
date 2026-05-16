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
    if (!adminUserDoc.exists || adminUserDoc.data()?.role !== "ADMIN") {
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
