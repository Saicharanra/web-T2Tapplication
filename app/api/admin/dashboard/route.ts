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

    // Verify Admin Role
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || userDoc.data()?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 1. Users Stats
    const totalUsersSnapshot = await adminDb.collection("users").count().get();
    const totalUsers = totalUsersSnapshot.data().count;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newThisWeekSnapshot = await adminDb.collection("users")
      .where("joinedAt", ">=", sevenDaysAgo)
      .count()
      .get();
    const newThisWeek = newThisWeekSnapshot.data().count;

    // 2. Submission Stats
    const pendingSubmissionsSnapshot = await adminDb.collection("submissions")
      .where("status", "==", "PENDING")
      .count()
      .get();
    const pendingSubmissions = pendingSubmissionsSnapshot.data().count;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const verifiedTodaySnapshot = await adminDb.collection("submissions")
      .where("status", "==", "VERIFIED")
      .where("updatedAt", ">=", today) // Assuming updatedAt is when it was verified
      .count()
      .get();
    const verifiedToday = verifiedTodaySnapshot.data().count;

    const rejectedTodaySnapshot = await adminDb.collection("submissions")
      .where("status", "==", "REJECTED")
      .where("updatedAt", ">=", today)
      .count()
      .get();
    const rejectedToday = rejectedTodaySnapshot.data().count;

    // 3. Total Points Awarded
    // In Firestore, summing is expensive without an aggregation service or a counter.
    // For now, we'll fetch verified submissions and sum them (up to a limit or just use 0)
    // In production, you'd maintain a global stats document.
    const verifiedSubmissionsSnapshot = await adminDb.collection("submissions")
        .where("status", "==", "VERIFIED")
        .select("pointsAwarded")
        .get();
    
    const totalPoints = verifiedSubmissionsSnapshot.docs.reduce((acc, doc) => acc + (doc.data().pointsAwarded || 0), 0);

    // 4. Recent Submissions Feed
    const recentSubmissionsSnapshot = await adminDb.collection("submissions")
      .orderBy("createdAt", "desc")
      .limit(6)
      .get();

    const recentSubmissions = await Promise.all(recentSubmissionsSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const userDoc = await adminDb.collection("users").doc(data.userId).get();
      const userData = userDoc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        user: userData ? { name: userData.name, email: userData.email } : null
      };
    }));

    return NextResponse.json({
      stats: {
        totalUsers,
        newThisWeek,
        pendingSubmissions,
        verifiedToday,
        rejectedToday,
        totalPoints,
      },
      recentSubmissions,
    });
  } catch (error: any) {
    console.error("💥 Error in admin dashboard route:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
