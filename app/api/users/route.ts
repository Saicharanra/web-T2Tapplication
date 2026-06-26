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

    // Verify Admin Role
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || !["ADMIN","OWNER"].includes(userDoc.data()?.role)) {
      // In some apps, regular users can see other users. 
      // But based on the original code, it seems like a general list.
      // I'll keep it admin only for security if it returns all users.
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const usersSnapshot = await adminDb.collection("users")
      .orderBy("points", "desc")
      .get();

    const users = await Promise.all(usersSnapshot.docs.map(async (doc) => {
      const userData = doc.data();
      const submissionsSnapshot = await adminDb.collection("submissions")
        .where("userId", "==", doc.id)
        .count()
        .get();
      
      return {
        id: doc.id,
        ...userData,
        submissions: { count: submissionsSnapshot.data().count }
      };
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
