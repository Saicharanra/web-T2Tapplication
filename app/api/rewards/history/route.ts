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

    // Extract unique reward IDs to solve N+1 query problem
    const uniqueRewardIds = Array.from(
      new Set(
        historyData
          .map((data: any) => data.reward_id)
          .filter(Boolean)
      )
    );

    const rewardRefs = (uniqueRewardIds as string[]).map(id => adminDb.collection("rewards").doc(id));
    const rewardSnapshots = rewardRefs.length > 0 ? await adminDb.getAll(...rewardRefs) : [];
    const rewardMap = new Map<string, any>();
    rewardSnapshots.forEach(snap => {
      if (snap.exists) {
        rewardMap.set(snap.id, snap.data());
      }
    });

    const history = historyData.map((data: any) => {
      const rewardData = rewardMap.get(data.reward_id);

      return {
        id: data.id,
        reward_id: data.reward_id,
        name: rewardData ? rewardData.title : "Unknown Reward",
        description: rewardData ? rewardData.description : "No description available",
        image_url: rewardData ? rewardData.image_url : "",
        category: rewardData ? rewardData.category : "General",
        points_required: rewardData ? rewardData.points_required : 0,
        date: (data.redeemed_at?.toDate?.() || new Date(data.redeemed_at)).toISOString().split("T")[0],
        code: data.code || `RWD-${data.id.substring(0, 6).toUpperCase()}`,
      };
    });

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

