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

    if (!adminUserDoc.exists || adminUser?.role !== "ADMIN") {
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

    // Fetch user info for each submission
    const submissionsWithUser = await Promise.all(slicedSubmissions.map(async (sub: any) => {
      const userDoc = await adminDb.collection("users").doc(sub.userId).get();
      const userData = userDoc.data();
      return {
        ...sub,
        createdAt: sub.createdAt?.toDate?.() || sub.createdAt,
        user: userData ? {
          id: userDoc.id,
          name: userData.name,
          email: userData.email,
          level: userData.level,
          points: userData.points
        } : null
      };
    }));

    return NextResponse.json({
      submissions: submissionsWithUser,
      total: allSubmissions.length,
      limit: limitNum,
      offset,
    });
  } catch (error: any) {
    console.error("💥 Server Error:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}