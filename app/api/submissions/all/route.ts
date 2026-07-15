import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const adminUserId = decodedToken.uid;

    if (!adminUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUserDoc = await adminDb.collection("users").doc(adminUserId).get();
    const adminUser = adminUserDoc.data();

    if (!adminUserDoc.exists || !["ADMIN","OWNER"].includes(adminUser?.role)) {
      return NextResponse.json(
        {
          error: "Forbidden: Admin access required",
          currentRole: adminUser?.role,
        },
        { status: 403 }
      );
    }

    // Parse filters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const filterUserId = searchParams.get("userId");
    const limitNum = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let baseQuery: any = adminDb.collection("submissions");

    if (status) baseQuery = baseQuery.where("status", "==", status);
    if (filterUserId) baseQuery = baseQuery.where("userId", "==", filterUserId);

    // Count request
    if (searchParams.has("count")) {
      const snapshot = await baseQuery.count().get();
      return NextResponse.json({ count: snapshot.data().count || 0 });
    }

    // Data request
    // Note: Firestore pagination is different (startAfter), but for simple list we fetch all and slice for small offsets
    // For production, this should be improved with real pagination tokens
    const snapshot = await baseQuery.get();
    
    const allSubmissions = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    // Sort in memory
    allSubmissions.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    const slicedSubmissions = allSubmissions.slice(offset, offset + limitNum);

    // Extract unique user IDs to solve N+1 query problem
    const uniqueUserIds = Array.from(
      new Set(
        slicedSubmissions
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

    // Fetch user info for each submission using the batch loaded map
    const submissionsWithUser = slicedSubmissions.map((sub: any) => {
      const userData = userMap.get(sub.userId);
      return {
        ...sub,
        createdAt: sub.createdAt?.toDate?.() || sub.createdAt,
        user: userData ? {
          id: sub.userId,
          name: userData.name,
          email: userData.email,
          level: userData.level,
          points: userData.points
        } : null
      };
    });

    return NextResponse.json({
      submissions: submissionsWithUser,
      total: allSubmissions.length,
      limit: limitNum,
      offset,
    });
  } catch (error: any) {
    console.error("?? Server Error:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
