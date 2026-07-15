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

    // Get user data
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Get total submissions count
    let totalSubmissions = 0;
    try {
      const submissionsSnapshot = await adminDb.collection("submissions")
        .where("userId", "==", userId)
        .count()
        .get();
      totalSubmissions = submissionsSnapshot.data().count;
    } catch (e) {
      console.warn("⚠️ Could not count submissions:", e);
    }

    // Calculate streak (count submissions in last 7 days)
    let streak = 0;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentSubmissionsSnapshot = await adminDb.collection("submissions")
        .where("userId", "==", userId)
        .where("createdAt", ">=", sevenDaysAgo)
        .count()
        .get();
      streak = recentSubmissionsSnapshot.data().count;
    } catch (e) {
      console.warn("⚠️ Could not calculate streak (index might be missing):", e);
      // Fallback: just use 0 or fetch all and filter in memory if small
    }

    return NextResponse.json({
      totalPoints: Number(userData?.points) || 0,
      level: userData?.level || 'BRONZE',
      totalSubmissions: totalSubmissions || 0,
      streak: streak || 0,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user stats:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

