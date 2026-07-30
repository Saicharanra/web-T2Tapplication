import { fetchWithAuth } from "@/lib/fetch-with-auth";

/**
 * Creates an in-app notification row in Supabase Notification table.
 * Replaces the Firestore 'notifications' collection write.
 * Isomorphic: if called on the server, runs Supabase direct write. If called on the client,
 * safely delegates to our secure server-side route handler.
 */
export async function createNotification(
  userId: string,
  email: string,
  type: string,
  title: string,
  message: string
): Promise<string> {
  // 1. Client-side context: proxy call to the secure API route handler
  if (typeof window !== "undefined") {
    try {
      console.log(`📡 Initiating proxy client-side notification dispatch for user ${userId}`);
      const response = await fetchWithAuth("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          email,
          type,
          title,
          message,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to create notification through proxy API");
      }

      const data = await response.json();
      return data.notificationId;
    } catch (error: any) {
      console.error("❌ Client-side notification proxy failed:", error);
      throw error;
    }
  }

  // 2. Server-side context: direct database insertion
  try {
    if (!userId || !email) {
      throw new Error("Missing recipient userId or email parameters.");
    }

    const { supabaseAdmin } = await import("@/lib/supabase-server");
    if (!supabaseAdmin) {
      throw new Error("Supabase Admin is not initialized on the server");
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        email,
        type,
        title,
        message,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("❌ Failed to insert Supabase notification:", error);
      throw new Error(error?.message || "Failed to create notification");
    }

    console.log(`🔔 Notification created: ${data.id} for user ${userId}`);
    return data.id;
  } catch (error) {
    console.error("❌ Failed to create in-app notification server-side:", error);
    throw error;
  }
}
