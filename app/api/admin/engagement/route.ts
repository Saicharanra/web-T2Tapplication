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

    console.log("Fetching user engagement tracking data");

    // Fetch the recent analytics logs (limit to 500 for performance)
    const analyticsSnapshot = await adminDb.collection("analytics")
      .orderBy("timestamp", "desc")
      .limit(500)
      .get();

    const logs = analyticsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        pathname: data.pathname,
        timeSpent: data.timeSpent || 0,
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
      };
    });

    // In-memory aggregations for KPIs
    const totalSessions = logs.length;
    let totalTimeSpent = 0; // in seconds
    const pathVisits = new Map<string, number>();
    const pathTime = new Map<string, number>();

    logs.forEach((log) => {
      totalTimeSpent += log.timeSpent || 0;
      const path = log.pathname || "unknown";
      pathVisits.set(path, (pathVisits.get(path) || 0) + 1);
      pathTime.set(path, (pathTime.get(path) || 0) + log.timeSpent);
    });

    const averageSessionDuration = totalSessions > 0 ? Math.round(totalTimeSpent / totalSessions) : 0;

    // Convert Map statistics to array format for easy frontend rendering
    const pageStats = Array.from(pathVisits.keys()).map((path) => {
      const visits = pathVisits.get(path) || 0;
      const totalTime = pathTime.get(path) || 0;
      return {
        path,
        visits,
        totalTime,
        avgTime: visits > 0 ? Math.round(totalTime / visits) : 0,
      };
    }).sort((a, b) => b.visits - a.visits);

    // Find the most popular page
    const mostPopularPage = pageStats.length > 0 ? pageStats[0].path : "N/A";

    return NextResponse.json({
      stats: {
        totalSessions,
        totalTimeSpent, // in seconds
        averageSessionDuration, // in seconds
        mostPopularPage,
      },
      pageStats,
      logs: logs.slice(0, 100), // return the most recent 100 logs for the feed
    });
  } catch (error: any) {
    console.error("💥 Error in admin engagement route:", error);
    if (error?.message?.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch engagement data" },
      { status: 500 }
    );
  }
}
