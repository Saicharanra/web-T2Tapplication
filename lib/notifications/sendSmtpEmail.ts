import nodemailer from "nodemailer";

interface SendSmtpEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using Nodemailer SMTP based on credentials in .env.local
 */
export async function sendSmtpEmail({ to, subject, html }: SendSmtpEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
    const SMTP_SECURE = process.env.SMTP_SECURE !== "false";
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn("⚠️ SMTP credentials not fully configured in env. Mocking successful email send.");
      return { success: true, messageId: `mock_smtp_${Date.now()}` };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"Trash2Treasure" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ SMTP email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ SMTP send failed:", error);
    return { success: false, error: error.message || "Failed to send email via SMTP" };
  }
}
