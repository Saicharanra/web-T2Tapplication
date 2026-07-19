import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/firebase-admin";
import { createNotification } from "@/lib/notifications/createNotification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Secure POST proxy API to create in-app notifications.
 * Verifies the user session before calling createNotification on the server.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const decodedToken = await verifySession(req);
    const authUserId = decodedToken.uid;

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request payload
    const body = await req.json();
    const { userId, email, type, title, message } = body;

    if (!userId || !email || !type || !title || !message) {
      return NextResponse.json({ error: "Missing required notification payload fields." }, { status: 400 });
    }

    // 3. Create the notification (runs server-side code path using supabaseAdmin)
    const notificationId = await createNotification(userId, email, type, title, message);

    return NextResponse.json({ success: true, notificationId }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Secure proxy notification route failed:", error);
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to create notification." }, { status });
  }
}
