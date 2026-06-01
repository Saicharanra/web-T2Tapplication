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
    
    const transactions = await Promise.all(verifiedSubmissions.map(async (sub: any) => {
      const pts = Math.floor(sub.pointsAwarded || 0);
      totalPoints += pts;

      const userDoc = await adminDb.collection("users").doc(sub.userId).get();
      const userData = userDoc.data();
      const userName = userData?.name || "Unknown";
      
      usersPointsMap.set(userName, (usersPointsMap.get(userName) || 0) + pts);

      return {
        id: sub.id,
        user: userName,
        role: userData?.role || "USER",
        email: userData?.email || "",
        action: "points_awarded",
        amount: pts,
        wasteType: sub.wasteType || "",
        date: sub.updatedAt?.toDate?.()?.toLocaleDateString() || new Date(sub.updatedAt).toLocaleDateString()
      };
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
      transactions: transactions.slice(0, 50)
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