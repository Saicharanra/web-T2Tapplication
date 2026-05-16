import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch total points for the user
    const pointsHistorySnapshot = await adminDb.collection("pointsHistory")
      .where("userId", "==", userId)
      .get();
    
    const pointsHistory = pointsHistorySnapshot.docs.map(doc => doc.data());
    const totalPoints = pointsHistory.reduce((sum, record) => sum + (record.points || 0), 0);

    // Calculate average points
    const avgPoints = pointsHistory.length > 0 ? totalPoints / pointsHistory.length : 0;

    // Find top earner globally
    const topEarnerSnapshot = await adminDb.collection("users")
      .orderBy("points", "desc")
      .limit(1)
      .get();
    
    const topEarner = !topEarnerSnapshot.empty ? {
        name: topEarnerSnapshot.docs[0].data().name,
        points: topEarnerSnapshot.docs[0].data().points
    } : null;

    return NextResponse.json({
      totalPoints: totalPoints || 0,
      avgPoints: Math.round(avgPoints || 0),
      topEarner,
    });
  } catch (error: any) {
    console.error("Error fetching points stats:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch points statistics" },
      { status: 500 }
    );
  }
}