import { createNotification } from "./createNotification";
import { sendEmail } from "./sendEmail";

interface NotifyParams {
  userId: string;
  email: string;
  type: string;
  title: string;
  message: string;
  emailTemplate?:
    | "welcome"
    | "verification"
    | "login"
    | "received"
    | "approved"
    | "rejected"
    | "claimed"
    | "redeemed"
    | "delivered"
    | "admin"
    | "password_reset"
    | "account_update"
    | "announcement";
  emailProps?: Record<string, any>;
}

/**
 * Dispatches both an in-app Firestore notification and a Resend transactional email
 * simultaneously under a single coordinated helper.
 */
export async function notify({
  userId,
  email,
  type,
  title,
  message,
  emailTemplate,
  emailProps,
}: NotifyParams): Promise<{ notificationId: string; emailResult?: any }> {
  try {
    if (!userId || !email) {
      throw new Error("Missing recipient userId or email credentials.");
    }

    // 1. Dispatch In-App Firestore Notification
    const notificationId = await createNotification(userId, email, type, title, message);

    let emailResult: any = undefined;

    // 2. Dispatch Email Notification if template details are supplied
    if (emailTemplate) {
      const subject = title;
      const props = emailProps || { name: "Eco Friend" };
      
      try {
        emailResult = await sendEmail(email, subject, emailTemplate, props);
      } catch (err) {
        console.error(`⚠️ Coordinated email delivery failed for user ${userId} but in-app notification succeeded:`, err);
      }
    }

    return {
      notificationId,
      emailResult,
    };
  } catch (error) {
    console.error("❌ Coordinated notify system failed:", error);
    throw error;
  }
}
