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
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = userDoc.data();

    // Get points history
    let transactions: any[] = [];
    let historyDocs: any[] = [];
    
    try {
      // 1. Try to fetch sorted using highly optimized composite index
      const historySnapshot = await adminDb.collection("pointsHistory")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
      historyDocs = historySnapshot.docs;
    } catch (indexErr) {
      console.warn("⚠️ PointsHistory index is missing or building. Falling back to in-memory sort...", indexErr);
      
      try {
        // 2. Fallback: fetch unsorted and sort in memory
        const historySnapshot = await adminDb.collection("pointsHistory")
          .where("userId", "==", userId)
          .get();
        
        historyDocs = historySnapshot.docs;
        // Sort in memory: newest first
        historyDocs.sort((a, b) => {
          const dateA = a.data().createdAt?.toDate?.() || new Date(a.data().createdAt);
          const dateB = b.data().createdAt?.toDate?.() || new Date(b.data().createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      } catch (fallbackErr) {
        console.error("❌ Failed to fetch points history fallback:", fallbackErr);
      }
    }

    try {
      // Extract unique submission IDs to solve N+1 query problem
      const uniqueSubmissionIds = Array.from(
        new Set(
          historyDocs
            .map(doc => doc.data().submissionId)
            .filter(Boolean)
        )
      );

      const submissionRefs = (uniqueSubmissionIds as string[]).map(id => adminDb.collection("submissions").doc(id));
      const submissionSnapshots = submissionRefs.length > 0 ? await adminDb.getAll(...submissionRefs) : [];
      const submissionMap = new Map<string, any>();
      submissionSnapshots.forEach(snap => {
        if (snap.exists) {
          submissionMap.set(snap.id, snap.data());
        }
      });

      transactions = historyDocs.map((doc) => {
        const data = doc.data();
        let submission = null;
        if (data.submissionId) {
          const subData = submissionMap.get(data.submissionId);
          if (subData) {
            submission = { wasteType: subData.wasteType };
          }
        }
        return {
          id: doc.id,
          points: Number(data.points) || 0,
          description: data.description || `Points from recycling`,
          type: data.type,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString(),
          submission,
        };
      });
    } catch (e) {
      console.warn("⚠️ Could not process points history transactions:", e);
    }

    // Calculate stats
    const totalEarned = transactions
      .filter(t => t.type === 'EARNED' || t.type === 'BONUS')
      .reduce((sum, t) => sum + (Number(t.points) || 0), 0);

    const totalRedeemed = Math.abs(transactions
      .filter(t => t.type === 'REDEEMED')
      .reduce((sum, t) => sum + (Number(t.points) || 0), 0));

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthPoints = transactions
      .filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= firstDayOfMonth && (t.type === 'EARNED' || t.type === 'BONUS');
      })
      .reduce((sum, t) => sum + (Number(t.points) || 0), 0);

    return NextResponse.json({
      totalPoints: Number(userData?.points) || 0,
      thisMonthPoints,
      totalEarned,
      totalRedeemed,
      transactions,
    }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error in wallet route:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch wallet data" },
      { status: 500 }
    );
  }
}

