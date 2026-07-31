import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createNotification } from "@/lib/notifications/createNotification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── GET: Fetch user's notifications ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    const userId = session.uid;

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
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch notifications." }, { status });
  }
}

// ─── POST: Create in-app notification (server proxy) ─────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);

    const body = await req.json();
    const { userId, email, type, title, message } = body;

    if (!userId || !email || !type || !title || !message) {
      return NextResponse.json({ error: "Missing required notification payload fields." }, { status: 400 });
    }

    const notificationId = await createNotification(userId, email, type, title, message);

    return NextResponse.json({ success: true, notificationId }, { status: 200 });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to create notification." }, { status });
  }
}

// ─── PATCH: Mark notification as read ────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await verifySession(req);
    const userId = session.uid;

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await supabaseAdmin
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId or markAllRead is required" }, { status: 400 });
    }

    await supabaseAdmin
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to update notification." }, { status });
  }
}
