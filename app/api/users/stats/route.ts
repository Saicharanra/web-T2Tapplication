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

    // Calculate real daily usage streak (consecutive unique calendar days active)
    let streak = 0;
    try {
      const submissionsSnapshot = await adminDb.collection("submissions")
        .where("userId", "==", userId)
        .get();
      
      const dates = new Set<string>();
      submissionsSnapshot.docs.forEach((doc: any) => {
        const subData = doc.data();
        const dateObj = subData.createdAt?.toDate ? subData.createdAt.toDate() : new Date(subData.createdAt);
        if (dateObj && !isNaN(dateObj.getTime())) {
          dates.add(dateObj.toISOString().split('T')[0]); // YYYY-MM-DD
        }
      });

      // Calculate consecutive days starting from today or yesterday
      const today = new Date();
      let checkDate = new Date(today);
      let dateStr = checkDate.toISOString().split('T')[0];

      if (!dates.has(dateStr)) {
        // If not active today, check if active yesterday to keep streak alive
        checkDate.setDate(checkDate.getDate() - 1);
        dateStr = checkDate.toISOString().split('T')[0];
      }

      while (dates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        dateStr = checkDate.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn("⚠️ Could not calculate daily streak:", e);
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

