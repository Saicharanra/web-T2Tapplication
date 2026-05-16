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
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const user = userDoc.data();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required", currentRole: user?.role },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Build query
    let query: any = adminDb.collection("submissions");

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.count().get();
    const count = snapshot.data().count;

    return NextResponse.json({ count: count || 0 });
  } catch (error: any) {
    console.error("💥 Server Error:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to count submissions" },
      { status: 500 }
    );
  }
}