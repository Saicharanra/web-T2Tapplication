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

    console.log("Fetching dashboard stats");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parallelize all queries for massive performance boost and index elimination
    const [
      totalUsersSnapshot,
      newThisWeekSnapshot,
      pendingSubmissionsSnapshot,
      submissionsTodaySnapshot,
      verifiedSubmissionsSnapshot
    ] = await Promise.all([
      adminDb.collection("users").count().get(),
      adminDb.collection("users").where("joinedAt", ">=", sevenDaysAgo).count().get(),
      adminDb.collection("submissions").where("status", "==", "PENDING").count().get(),
      adminDb.collection("submissions").where("updatedAt", ">=", today).get(),
      adminDb.collection("submissions").where("status", "==", "VERIFIED").select("pointsAwarded").get()
    ]);

    const totalUsers = totalUsersSnapshot.data().count;
    const newThisWeek = newThisWeekSnapshot.data().count;
    const pendingSubmissions = pendingSubmissionsSnapshot.data().count;

    // Calculate daily stats in-memory to completely eliminate composite index requirements
    let verifiedToday = 0;
    let rejectedToday = 0;

    submissionsTodaySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === "VERIFIED") {
        verifiedToday++;
      } else if (data.status === "REJECTED") {
        rejectedToday++;
      }
    });

    console.log("Submissions found:", verifiedToday + rejectedToday + pendingSubmissions);

    const totalPoints = verifiedSubmissionsSnapshot.docs.reduce((acc, doc) => acc + (doc.data().pointsAwarded || 0), 0);

    // 4. Recent Submissions Feed
    const recentSubmissionsSnapshot = await adminDb.collection("submissions")
      .orderBy("createdAt", "desc")
      .limit(6)
      .get();

    // Extract unique user IDs from recent submissions to solve N+1 query problem
    const uniqueUserIds = Array.from(
      new Set(
        recentSubmissionsSnapshot.docs
          .map(doc => doc.data().userId)
          .filter(Boolean)
      )
    );

    const userRefs = (uniqueUserIds as string[]).map(id => adminDb.collection("users").doc(id));
    const userSnapshots = userRefs.length > 0 ? await adminDb.getAll(...userRefs) : [];
    const userMap = new Map<string, any>();
    userSnapshots.forEach(snap => {
      if (snap.exists) {
        userMap.set(snap.id, snap.data());
      }
    });

    const recentSubmissions = recentSubmissionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const userData = userMap.get(data.userId);
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        user: userData ? { name: userData.name, email: userData.email } : null
      };
    });

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
