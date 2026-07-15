import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";

import { sendEmail } from "@/lib/notifications/sendEmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Admin Role
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || !["ADMIN","OWNER"].includes(userDoc.data()?.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, message, targetAudience, scheduleType, scheduleDate } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    // Fetch all users to distribute the announcement
    const usersSnapshot = await adminDb.collection("users").get();
    const usersList: { id: string; email: string; name: string }[] = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        usersList.push({
          id: doc.id,
          email: data.email,
          name: data.name || "Eco Partner",
        });
      }
    });

    if (usersList.length === 0) {
      return NextResponse.json({ error: "No registered users found in the database" }, { status: 404 });
    }

    if (scheduleType === "scheduled") {
      // Create scheduled announcement document
      await adminDb.collection("scheduledAnnouncements").add({
        title,
        message,
        targetAudience,
        scheduleDate: scheduleDate || new Date().toISOString(),
        status: "queued",
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, count: 0, status: "queued" });
    }

    // Transactionally batch write in-app notifications
    const batch = adminDb.batch();
    const notificationsRef = adminDb.collection("notifications");

    usersList.forEach((recipient) => {
      const newNotifRef = notificationsRef.doc();
      batch.set(newNotifRef, {
        userId: recipient.id,
        email: recipient.email,
        type: "announcement",
        title: `?? ${title}`,
        message: message.length > 120 ? `${message.slice(0, 117)}...` : message,
        read: false,
        createdAt: new Date(),
      });
    });

    await batch.commit();

    // Dispatch Emails concurrently to protect timing
    const emailPromises = usersList.map((recipient) =>
      sendEmail(recipient.email, `?? Announcement: ${title}`, "announcement", {
        title,
        message,
        name: recipient.name,
      }).catch((err) =>
        console.warn(`Email delivery failed for ${recipient.email}:`, err)
      )
    );

    await Promise.all(emailPromises);

    return NextResponse.json({ success: true, count: usersList.length, status: "sent" });
  } catch (error: any) {
    console.error("?? Error in admin announcements route:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to dispatch announcements", details: error.message },
      { status: 500 }
    );
  }
}

