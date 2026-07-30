import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/firebase-admin";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createNotification } from "@/lib/notifications/createNotification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET endpoint to fetch all notifications for the authenticated user.
 * Bypasses client RLS via server-authenticated session.
 */
export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Failed to fetch notifications:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      email: row.email,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ notifications: formatted }, { status: 200 });
  } catch (error: any) {
    console.error("❌ GET /api/notifications error:", error);
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch notifications." }, { status });
  }
}

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
