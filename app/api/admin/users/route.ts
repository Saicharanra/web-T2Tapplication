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

    // Check if user is admin
    const adminUserDoc = await adminDb.collection("users").doc(userId).get();
    if (!adminUserDoc.exists || !["ADMIN","OWNER"].includes(adminUserDoc.data()?.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limitNum = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch all users
    // Firestore pagination is different (using startAfter), for simple offset we fetch and slice
    const usersSnapshot = await adminDb.collection("users")
      .orderBy("joinedAt", "desc")
      .get();
    
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const users = allUsers.slice(offset, offset + limitNum);

    // Fetch all submissions to calculate counts
    const submissionsSnapshot = await adminDb.collection("submissions").get();
    const submissions = submissionsSnapshot.docs.map(doc => doc.data());

    // Create submission count map
    const submissionMap = new Map<string, { total: number; verified: number; pending: number; rejected: number }>();
    
    submissions.forEach((sub) => {
      if (!submissionMap.has(sub.userId)) {
        submissionMap.set(sub.userId, { total: 0, verified: 0, pending: 0, rejected: 0 });
      }
      const stats = submissionMap.get(sub.userId)!;
      stats.total++;
      if (sub.status === 'VERIFIED') stats.verified++;
      else if (sub.status === 'PENDING') stats.pending++;
      else if (sub.status === 'REJECTED') stats.rejected++;
    });

    // Enhance users with submission counts
    const enhancedUsers = users.map((user: any) => {
      const submissionStats = submissionMap.get(user.id) || { total: 0, verified: 0, pending: 0, rejected: 0 };
      return {
        ...user,
        totalSubmissions: submissionStats.total,
        verifiedSubmissions: submissionStats.verified,
        pendingSubmissions: submissionStats.pending,
        rejectedSubmissions: submissionStats.rejected,
        createdAt: user.joinedAt?.toDate?.()?.toISOString() || user.joinedAt,
      };
    });

    // Calculate statistics
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u: any) => u.status === 'ACTIVE').length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newThisWeek = allUsers.filter((u: any) => {
        const joinedAt = u.joinedAt?.toDate?.() || new Date(u.joinedAt);
        return joinedAt >= sevenDaysAgo;
    }).length;

    const topContributors = enhancedUsers.filter((u: any) => u.verifiedSubmissions >= 5).length;

    return NextResponse.json({
      users: enhancedUsers,
      stats: {
        totalUsers,
        activeUsers,
        newThisWeek,
        topContributors,
      },
    });
  } catch (error: any) {
    console.error("💥 Error in admin users route:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}
