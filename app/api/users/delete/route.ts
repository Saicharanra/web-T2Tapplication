import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify user session from client
    const decodedToken = await verifySession(req);
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: "Database services unavailable" }, { status: 500 });
    }

    // 2. Delete user's Firestore document
    await adminDb.collection("users").doc(uid).delete();

    // 3. Clean up user's submissions
    const submissions = await adminDb.collection("submissions").where("userId", "==", uid).get();
    if (!submissions.empty) {
      const batch = adminDb.batch();
      submissions.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // 4. Clean up user's redemptions
    const redemptions = await adminDb.collection("redemptions").where("user_id", "==", uid).get();
    if (!redemptions.empty) {
      const batch = adminDb.batch();
      redemptions.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // 5. Clean up user's points history logs
    const pointsHistory = await adminDb.collection("pointsHistory").where("userId", "==", uid).get();
    if (!pointsHistory.empty) {
      const batch = adminDb.batch();
      pointsHistory.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // 6. Clean up user's notifications
    const notifications = await adminDb.collection("notifications").where("userId", "==", uid).get();
    if (!notifications.empty) {
      const batch = adminDb.batch();
      notifications.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // 7. Delete user from Firebase Auth
    await adminAuth.deleteUser(uid);

    return NextResponse.json({ success: true, message: "Account deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting user account:", error);
    if (error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
