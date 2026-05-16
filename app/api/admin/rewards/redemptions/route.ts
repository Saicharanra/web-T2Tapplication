import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch recent reward redemptions with user and reward info
 */
export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin
    const adminUserDoc = await adminDb.collection("users").doc(userId).get();
    if (!adminUserDoc.exists || adminUserDoc.data()?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limitNum = parseInt(searchParams.get("limit") || "20");

    // Fetch redemptions
    const redemptionsSnapshot = await adminDb.collection("redemptions")
      .orderBy("redeemed_at", "desc")
      .limit(limitNum)
      .get();

    const enrichedRedemptions = await Promise.all(redemptionsSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      // Fetch reward and user info
      const [rewardDoc, userDoc] = await Promise.all([
        adminDb.collection("rewards").doc(data.reward_id).get(),
        adminDb.collection("users").doc(data.user_id).get()
      ]);

      const rewardData = rewardDoc.data();
      const userData = userDoc.data();

      return {
        redemption_id: doc.id,
        reward_id: data.reward_id,
        user_id: data.user_id,
        redeemed_at: data.redeemed_at?.toDate?.() || data.redeemed_at,
        reward: rewardData ? {
          title: rewardData.title,
          points_required: rewardData.points_required,
          image_url: rewardData.image_url,
        } : null,
        user: userData ? {
          name: userData.name,
          email: userData.email,
          imageUrl: userData.imageUrl,
        } : null,
      };
    }));

    return NextResponse.json({ redemptions: enrichedRedemptions });
  } catch (error: any) {
    console.error("Error in GET /api/admin/rewards/redemptions:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
