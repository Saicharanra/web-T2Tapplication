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
    if (!userDoc.exists || !["ADMIN","OWNER"].includes(userDoc.data()?.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Fetch Verified Submissions with dynamic fallback
    let verifiedSubmissions: any[] = [];
    try {
      // 1. Try highly optimized composite index query (newest first)
      const verifiedSubmissionsSnapshot = await adminDb.collection("submissions")
        .where("status", "==", "VERIFIED")
        .orderBy("updatedAt", "desc")
        .get();
      verifiedSubmissions = verifiedSubmissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (indexErr) {
      console.warn("⚠️ Admin verified submissions index is missing or building. Falling back to in-memory sort...", indexErr);
      
      // 2. Fallback: Query equality filter only and sort in memory
      const verifiedSubmissionsSnapshot = await adminDb.collection("submissions")
        .where("status", "==", "VERIFIED")
        .get();
      
      verifiedSubmissions = verifiedSubmissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in-memory: Newest first
      verifiedSubmissions.sort((a, b) => {
        const dateA = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
        const dateB = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
        return dateB.getTime() - dateA.getTime();
      });
    }

    // Calculate Stats
    let totalPoints = 0;
    const usersPointsMap = new Map<string, number>();
    
    // Extract unique user IDs to solve N+1 query problem
    const uniqueUserIds = Array.from(
      new Set(
        verifiedSubmissions
          .map((sub: any) => sub.userId)
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

    const transactions = verifiedSubmissions.map((sub: any) => {
      const pts = Math.floor(sub.pointsAwarded || 0);
      totalPoints += pts;

      const userData = userMap.get(sub.userId);
      const userName = userData?.name || "Unknown";
      
      usersPointsMap.set(userName, (usersPointsMap.get(userName) || 0) + pts);

      return {
        id: sub.id,
        userId: sub.userId || "",
        user: userName,
        role: userData?.role || "USER",
        email: userData?.email || "",
        action: "points_awarded",
        amount: pts,
        wasteType: sub.wasteType || "",
        date: sub.updatedAt?.toDate?.()?.toLocaleDateString() || new Date(sub.updatedAt).toLocaleDateString()
      };
    });

    const uniqueUsersList = Array.from(userMap.entries()).map(([id, data]) => ({
      id,
      name: data.name || "Unknown",
      email: data.email || "",
      imageUrl: data.imageUrl || null,
      role: data.role || "USER",
      level: data.level || "BRONZE",
      points: data.points || 0,
      status: data.status || "ACTIVE",
      location: data.location || "Not specified",
      joinedAt: data.joinedAt?.toDate?.()?.toLocaleDateString() || (data.joinedAt ? new Date(data.joinedAt).toLocaleDateString() : "Unknown")
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDist = verifiedSubmissions
        .filter((s: any) => (s.updatedAt?.toDate?.() || new Date(s.updatedAt)) >= today)
        .reduce((acc, curr: any) => acc + (curr.pointsAwarded || 0), 0);

    let topEarner = "None";
    let topMax = 0;
    for (const [name, pts] of usersPointsMap.entries()) {
      if (pts > topMax) {
        topMax = pts;
        topEarner = name;
      }
    }

    const txCount = transactions.length || 1;
    const avgPerSub = Math.round(totalPoints / txCount);

    return NextResponse.json({
      stats: {
        totalDistributed: totalPoints,
        todayDistribution: todayDist,
        topEarner,
        averagePerSubmission: avgPerSub
      },
      users: uniqueUsersList,
      transactions: transactions
    });
  } catch (error: any) {
    console.error("💥 Error in admin points route:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch points data" },
      { status: 500 }
    );
  }
}
