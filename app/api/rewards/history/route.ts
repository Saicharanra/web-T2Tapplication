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

    // Fetch redemptions for this user
    const redemptionsSnapshot = await adminDb.collection("redemptions")
      .where("user_id", "==", userId)
      .get();

    const historyData = redemptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory
    historyData.sort((a: any, b: any) => {
      const dateA = a.redeemed_at?.toDate?.() || new Date(a.redeemed_at);
      const dateB = b.redeemed_at?.toDate?.() || new Date(b.redeemed_at);
      return dateB.getTime() - dateA.getTime();
    });

    const history = await Promise.all(historyData.map(async (data: any) => {
      // Fetch reward details
      const rewardDoc = await adminDb.collection("rewards").doc(data.reward_id).get();
      const rewardData = rewardDoc.data();

      return {
        id: data.id,
        name: rewardData ? rewardData.title : "Unknown Reward",
        date: (data.redeemed_at?.toDate?.() || new Date(data.redeemed_at)).toISOString().split("T")[0],
        code: data.code || `RWD-${data.id.substring(0, 6).toUpperCase()}`,
      };
    }));

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("Error in GET /api/rewards/history:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
