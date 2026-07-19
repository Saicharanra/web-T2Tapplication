import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";



export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const decodedToken = await verifySession(req);
    const adminId = decodedToken.uid;
    const { id: targetUserId } = params;

    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUserDoc = await adminDb.collection("users").doc(adminId).get();
    if (!adminUserDoc.exists || !["ADMIN","OWNER"].includes(adminUserDoc.data()?.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { role } = await req.json();

    if (!role || !["ADMIN", "USER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Update user role in Firestore
    await adminDb.collection("users").doc(targetUserId).update({
      role,
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: "User role updated successfully" });
  } catch (error: any) {
    console.error("💥 Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role", details: error.message },
      { status: 500 }
    );
  }
}
