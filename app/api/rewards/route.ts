import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rewardsSnapshot = await adminDb.collection("rewards").get();

    const rewards = rewardsSnapshot.docs
      .map(doc => ({
        reward_id: doc.id,
        ...doc.data()
      }))
      .filter((r: any) => r.status === "Active")
      .sort((a: any, b: any) => (a.points_required || 0) - (b.points_required || 0));

    return NextResponse.json({ rewards });
  } catch (error: any) {
    console.error("Error in GET /api/rewards:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reward_id } = body;

    if (!reward_id) {
      return NextResponse.json({ error: "reward_id is required" }, { status: 400 });
    }

    // Using transaction for atomicity
    const result = await adminDb.runTransaction(async (transaction) => {
      const rewardRef = adminDb.collection("rewards").doc(reward_id);
      const rewardDoc = await transaction.get(rewardRef);

      if (!rewardDoc.exists || rewardDoc.data()?.status !== "Active") {
        throw new Error("Reward not found or inactive");
      }

      const reward = rewardDoc.data()!;
      if (reward.stock <= 0 && reward.stock !== 999) {
        throw new Error("Reward is out of stock");
      }

      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const user = userDoc.data()!;
      if ((user.points || 0) < reward.points_required) {
        throw new Error("Insufficient points");
      }

      // Deduct points
      transaction.update(userRef, { points: (user.points || 0) - reward.points_required });

      // Decrease stock
      if (reward.stock !== 999) {
        transaction.update(rewardRef, { stock: reward.stock - 1 });
      }

      // Record redemption
      const redemptionRef = adminDb.collection("redemptions").doc();
      transaction.set(redemptionRef, {
        reward_id: reward_id,
        user_id: userId,
        redeemed_at: new Date(),
      });

      // Record in PointsHistory
      const historyRef = adminDb.collection("pointsHistory").doc();
      transaction.set(historyRef, {
        userId: userId,
        points: -reward.points_required,
        description: `Redeemed for ${reward.title}`,
        type: "REDEEMED",
        createdAt: new Date(),
      });

      return {
        newPoints: (user.points || 0) - reward.points_required,
        redemption_id: redemptionRef.id,
        reward: {
          title: reward.title,
          points_required: reward.points_required,
        },
      };
    });

    return NextResponse.json({
      message: "Reward redeemed successfully!",
      ...result,
    });
  } catch (error: any) {
    console.error("Error in POST /api/rewards:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
