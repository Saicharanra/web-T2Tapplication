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

    // Get user document
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Get user's submissions
    let submissions: any[] = [];
    try {
      const submissionsSnapshot = await adminDb.collection('submissions')
        .where('userId', '==', userId)
        .get();
      submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn("⚠️ Could not fetch submissions:", e);
    }

    const totalSubmissions = submissions.length;
    const verifiedSubmissions = submissions.filter(s => s.status === 'VERIFIED').length;
    const pendingSubmissions = submissions.filter(s => s.status === 'PENDING').length;
    const rejectedSubmissions = submissions.filter(s => s.status === 'REJECTED').length;

    // Calculate verification rate
    const verificationRate = totalSubmissions > 0 
      ? Math.round((verifiedSubmissions / totalSubmissions) * 100) 
      : 0;

    // Find most recycled waste type
    const wasteTypeCounts = submissions.reduce((acc: Record<string, number>, curr) => {
      const type = curr.wasteType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const mostRecycled = Object.entries(wasteTypeCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    const mostRecycledType = mostRecycled ? mostRecycled[0] : 'N/A';
    const mostRecycledCount = mostRecycled ? Number(mostRecycled[1]) : 0;

    // Calculate streak (submissions in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSubmissions = submissions.filter(s => {
        if (!s.createdAt) return false;
        const createdAt = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        return createdAt >= sevenDaysAgo;
    }).length;

    // Get user's rank
    let userRank = 0;
    try {
      const allUsersSnapshot = await adminDb.collection('users')
        .orderBy('points', 'desc')
        .limit(100) // Limit to avoid performance issues
        .get();
      
      const rankIndex = allUsersSnapshot.docs.findIndex(doc => doc.id === userId);
      userRank = rankIndex !== -1 ? rankIndex + 1 : 0;
    } catch (e) {
      console.warn("⚠️ Could not calculate rank (index might be missing):", e);
    }

    return NextResponse.json({
      totalSubmissions,
      verifiedSubmissions,
      pendingSubmissions,
      rejectedSubmissions,
      totalPoints: Number(userData?.points) || 0,
      mostRecycledType,
      mostRecycledCount,
      streak: recentSubmissions,
      verificationRate,
      rank: userRank,
    }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error fetching profile stats:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
