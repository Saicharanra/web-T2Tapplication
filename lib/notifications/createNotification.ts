import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Creates an in-app notification row in Supabase Notification table.
 * Replaces the Firestore 'notifications' collection write.
 */
export async function createNotification(
  userId: string,
  email: string,
  type: string,
  title: string,
  message: string
): Promise<string> {
  try {
    if (!userId || !email) {
      throw new Error("Missing recipient userId or email parameters.");
    }

    const { data, error } = await supabaseAdmin
      .from("Notification")
      .insert({
        userId,
        email,
        type,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
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
    console.error("❌ Failed to create in-app notification:", error);
    throw error;
  }
}
