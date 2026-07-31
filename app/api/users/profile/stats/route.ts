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
    const verifiedSubmissions = submissions.filter(s => {
      const st = (s.status || '').toUpperCase();
      return st === 'VERIFIED' || st === 'APPROVED' || st === 'ACCEPTED';
    }).length;
    
    const pendingSubmissions = submissions.filter(s => {
      const st = (s.status || '').toUpperCase();
      return st === 'PENDING' || st === 'SUBMITTED' || st === 'PROCESSING' || st === '';
    }).length;
    
    const rejectedSubmissions = submissions.filter(s => {
      const st = (s.status || '').toUpperCase();
      return st === 'REJECTED';
    }).length;

    // Calculate verification rate
    const verificationRate = totalSubmissions > 0 
      ? Math.round((verifiedSubmissions / totalSubmissions) * 100) 
      : 0;

    // Find most recycled waste type
    const wasteTypeCounts = submissions.reduce((acc: Record<string, number>, curr) => {
      const type = curr.wasteType || curr.category || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const mostRecycled = Object.entries(wasteTypeCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    const mostRecycledType = mostRecycled ? mostRecycled[0] : 'N/A';
    const mostRecycledCount = mostRecycled ? Number(mostRecycled[1]) : 0;

    // Calculate streak by consecutive CALENDAR DAYS (not photo upload count)
    const activeDates = new Set<string>();
    const todayStr = new Date().toISOString().split("T")[0];
    activeDates.add(todayStr); // Today's active session

    for (const s of submissions) {
      if (s.createdAt) {
        const d = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        if (!isNaN(d.getTime())) {
          activeDates.add(d.toISOString().split("T")[0]);
        }
      }
    }

    let dayStreak = 0;
    let checkDate = new Date();

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (activeDates.has(dateStr)) {
        dayStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Get user's rank
    let userRank = 0;
    try {
      const allUsersSnapshot = await adminDb.collection('users')
        .orderBy('points', 'desc')
        .limit(100)
        .get();
      
      const rankIndex = allUsersSnapshot.docs.findIndex(doc => doc.id === userId);
      userRank = rankIndex !== -1 ? rankIndex + 1 : 0;
    } catch (e) {
      console.warn("⚠️ Could not calculate rank:", e);
    }

    const computedPoints = decodedToken.points ?? Number(userData?.points) ?? 0;

    return NextResponse.json({
      totalSubmissions,
      verifiedSubmissions,
      pendingSubmissions,
      rejectedSubmissions,
      totalPoints: computedPoints,
      mostRecycledType,
      mostRecycledCount,
      streak: dayStreak,
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

