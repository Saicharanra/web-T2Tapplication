import { db } from "@/lib/firebase-client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Creates and logs an in-app notification in the Firestore "notifications" collection.
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

    const notificationsRef = collection(db, "notifications");
    const docRef = await addDoc(notificationsRef, {
      userId,
      email,
      type,
      title,
      message,
      read: false,
      createdAt: serverTimestamp(),
    });

    console.log(`🔔 In-App Notification created: ${docRef.id} for user ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Failed to log Firestore in-app notification:", error);
    throw error;
  }
}
