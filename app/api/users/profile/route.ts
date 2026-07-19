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

    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      // Return a basic profile if not found in DB
      return NextResponse.json({
        id: userId,
        name: "User",
        email: decodedToken.email || "",
        role: "USER",
        level: "BRONZE",
        points: 0,
        status: "ACTIVE"
      }, { status: 200 });
    }

    const userData = { id: userDoc.id, ...userDoc.data() };

    return NextResponse.json(userData, { status: 200 });
  } catch (error: any) {
    console.error("Error in profile route:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

