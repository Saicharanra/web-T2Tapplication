import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";
import { supabaseAdmin } from "@/lib/supabase-server";
import { calculateDailyStreak } from "@/lib/streak";

interface SupabaseSubmission {
  id: string;
  category?: string;
  status?: string;
  points_awarded?: number;
  created_at?: string;
}

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

    // Get user's submissions from both Firebase and Supabase
    let submissions: any[] = [];
    try {
      const submissionsSnapshot = await adminDb.collection('submissions')
        .where('userId', '==', userId)
        .get();
      submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn("⚠️ Could not fetch submissions from D:", e);
    }

    try {
      const { data: supaSubs } = await supabaseAdmin
        .from('waste_submissions')
        .select('id, category, status, points_awarded, created_at')
        .eq('user_id', userId);
      if (supaSubs && supaSubs.length > 0) {
        const mappedSupa = (supaSubs as SupabaseSubmission[]).map((s: SupabaseSubmission) => ({
          id: s.id,
          wasteType: s.category,
          status: s.status,
          pointsAwarded: s.points_awarded,
          createdAt: s.created_at
        }));
        const existingIds = new Set(submissions.map((s: any) => s.id));
        for (const ms of mappedSupa) {
          if (!existingIds.has(ms.id)) {
            submissions.push(ms);
          }
        }
      }
    } catch (e) {
      console.warn("⚠️ Could not fetch submissions from Supabase:", e);
    }

    const totalSubmissions = submissions.length;
    const verifiedSubmissions = submissions.filter((s: any) => {
      const st = (s.status || '').toUpperCase();
      return st === 'VERIFIED' || st === 'APPROVED' || st === 'ACCEPTED';
    }).length;
    
    const pendingSubmissions = submissions.filter((s: any) => {
      const st = (s.status || '').toUpperCase();
      return st === 'PENDING' || st === 'SUBMITTED' || st === 'PROCESSING' || st === '';
    }).length;
    
    const rejectedSubmissions = submissions.filter((s: any) => {
      const st = (s.status || '').toUpperCase();
      return st === 'REJECTED';
    }).length;

    // Calculate verification rate
    const verificationRate = totalSubmissions > 0 
      ? Math.round((verifiedSubmissions / totalSubmissions) * 100) 
      : 0;

    // Find most recycled waste type
    const wasteTypeCounts = submissions.reduce((acc: Record<string, number>, curr: any) => {
      const type = curr.wasteType || curr.category || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const mostRecycled = Object.entries(wasteTypeCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    const mostRecycledType = mostRecycled ? mostRecycled[0] : 'N/A';
    const mostRecycledCount = mostRecycled ? Number(mostRecycled[1]) : 0;

    // Calculate daily streak (resets to 0 if user did not upload today or yesterday)
    const submissionDates = submissions.map((s: any) => s.createdAt).filter(Boolean);
    const dayStreak = calculateDailyStreak(submissionDates);

    // Get user's dynamic rank safely
    let userRank = 0;
    try {
      const { data: allProfiles } = await supabaseAdmin.from('profiles').select('id, role');
      const userProfiles = (allProfiles || []).filter((p: any) => (p.role || "USER").toUpperCase() === "USER");
      if (userProfiles && userProfiles.length > 0) {
        const { data: subPoints } = await supabaseAdmin
          .from('waste_submissions')
          .select('user_id, points_awarded, status');
        
        const pMap = new Map<string, number>();
        (subPoints || []).forEach((s: any) => {
          const st = (s.status || '').toUpperCase();
          if (st === 'VERIFIED' || st === 'APPROVED' || st === 'ACCEPTED') {
            pMap.set(s.user_id, (pMap.get(s.user_id) || 0) + (Number(s.points_awarded) || 15));
          }
        });

        const sorted = userProfiles.map((p: any) => ({
          id: p.id,
          points: pMap.get(p.id) || 0
        })).sort((a: any, b: any) => b.points - a.points);

        const rIdx = sorted.findIndex((u: any) => u.id === userId);
        userRank = rIdx !== -1 ? rIdx + 1 : 1;
      }
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

