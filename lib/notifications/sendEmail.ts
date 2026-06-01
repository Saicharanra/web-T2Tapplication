/**
 * Sends a transactional email using Resend and our production-grade HTML templates.
 * Isomorphic: if called on the server, runs Resend SDK directly. If called on the client,
 * safely delegates to our secure server-side route handler to protect API credentials.
 */
export async function sendEmail(
  to: string,
  subject: string,
  templateName:
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
    | "announcement",
  templateProps: Record<string, any>
): Promise<any> {
  // 1. Server-side context (Direct Resend invocation)
  if (typeof window === "undefined") {
    try {
      const { resend, EMAIL_FROM, isResendConfigured } = await import("@/lib/resend");
      const {
        WelcomeEmail,
        EmailVerificationEmail,
        LoginNotificationEmail,
        SubmissionReceivedEmail,
        SubmissionApprovedEmail,
        SubmissionRejectedEmail,
        RewardClaimedEmail,
        RewardRedeemedEmail,
        RewardDeliveredEmail,
        AdminNotificationEmail,
        PasswordResetEmail,
        AccountUpdateEmail,
        AnnouncementEmail,
      } = await import("./templates");

      console.log(`📡 Initiating server-side email dispatch to [${to}] for event type: ${templateName}`);

      if (!isResendConfigured) {
        console.warn("⚠️ Resend is not configured (missing RESEND_API_KEY). Mocking email success.");
        return { id: `mock_email_${Date.now()}` };
      }

      let htmlContent = "";

      switch (templateName) {
        case "welcome":
          htmlContent = WelcomeEmail({ name: templateProps.name });
          break;
        case "verification":
          htmlContent = EmailVerificationEmail({
            name: templateProps.name || "Eco Partner",
            url: templateProps.url || "#",
          });
          break;
        case "login":
          htmlContent = LoginNotificationEmail({
            name: templateProps.name || "Eco Partner",
            device: templateProps.device || "Unknown Browser",
            time: templateProps.time || new Date().toLocaleString(),
          });
          break;
        case "received":
          htmlContent = SubmissionReceivedEmail({
            name: templateProps.name || "Eco Friend",
            wasteType: templateProps.wasteType || "Recyclable",
            location: templateProps.location || "Not specified",
          });
          break;
        case "approved":
          htmlContent = SubmissionApprovedEmail({
            name: templateProps.name || "Eco Friend",
            wasteType: templateProps.wasteType || "Recyclable",
            points: templateProps.points || 0,
          });
          break;
        case "rejected":
          htmlContent = SubmissionRejectedEmail({
            name: templateProps.name || "Eco Friend",
            wasteType: templateProps.wasteType || "Recyclable",
            reason: templateProps.reason || "Image is not clear",
          });
          break;
        case "claimed":
          htmlContent = RewardClaimedEmail({
            name: templateProps.name || "Eco Partner",
            rewardName: templateProps.rewardName || "Eco Gift",
            pointsCost: templateProps.pointsCost || 0,
          });
          break;
        case "redeemed":
          htmlContent = RewardRedeemedEmail({
            name: templateProps.name || "Eco Partner",
            rewardName: templateProps.rewardName || "Eco Gift",
            voucherCode: templateProps.voucherCode || "T2T-CLAIMED",
          });
          break;
        case "delivered":
          htmlContent = RewardDeliveredEmail({
            name: templateProps.name || "Eco Partner",
            rewardName: templateProps.rewardName || "Eco Gift",
          });
          break;
        case "admin":
          htmlContent = AdminNotificationEmail({
            title: templateProps.title || "System Alert",
            message: templateProps.message || "An administrative update has occurred.",
          });
          break;
        case "password_reset":
          htmlContent = PasswordResetEmail({
            name: templateProps.name || "Eco Partner",
            url: templateProps.url || "#",
          });
          break;
        case "account_update":
          htmlContent = AccountUpdateEmail({
            name: templateProps.name || "Eco Partner",
            updateType: templateProps.updateType || "Account Setting Changed",
            details: templateProps.details || "Settings were updated successfully.",
          });
          break;
        case "announcement":
          htmlContent = AnnouncementEmail({
            title: templateProps.title || "Global Community Announcement",
            message: templateProps.message || "",
          });
          break;
        default:
          throw new Error(`Unknown email template name: ${templateName}`);
      }

      const response = await resend.emails.send({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html: htmlContent,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log(`✅ Server email sent via Resend. Message ID: ${response.data?.id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Direct server Resend email transmission failed to [${to}]:`, error);
      // Soft catch: do not throw to prevent app crashing, return a meaningful error object
      return { error: true, message: error.message || "Unknown mail delivery issue." };
    }
  } else {
    // 2. Client-side context (Safe POST call to API route handler)
    try {
      console.log(`📡 Initiating proxy client-side email dispatch to [${to}] for: ${templateName}`);
      const response = await fetch("/api/notifications/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          templateName,
          templateProps,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to transmit secure email through client API");
      }

      const data = await response.json();
      return data.result;
    } catch (error: any) {
      console.error(`❌ Client-side proxy email transmission failed to [${to}]:`, error);
      return { error: true, message: error.message || "Proxy mail delivery issue." };
    }
  }
}
