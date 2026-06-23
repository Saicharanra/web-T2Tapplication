import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Contact form endpoint — sends user messages to the company inbox
 * via Nodemailer SMTP (cPanel / Hostinger / GoDaddy or any SMTP host).
 *
 * Required env vars:
 *   SMTP_HOST        e.g. mail.trash2treasure.co.in
 *   SMTP_PORT        e.g. 465 (SSL) or 587 (TLS)
 *   SMTP_SECURE      "true" for port 465, "false" for 587
 *   SMTP_USER        info@trash2treasure.co.in
 *   SMTP_PASS        <your email password>
 *   ADMIN_EMAIL      inbox that should receive the contact messages
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields (name, email, subject, message) are required." },
        { status: 400 }
      );
    }

    // ── SMTP Configuration ───────────────────────────────────────────────────
    const SMTP_HOST   = process.env.SMTP_HOST;
    const SMTP_PORT   = parseInt(process.env.SMTP_PORT || "465", 10);
    const SMTP_SECURE = process.env.SMTP_SECURE !== "false"; // default true (SSL)
    const SMTP_USER   = process.env.SMTP_USER;
    const SMTP_PASS   = process.env.SMTP_PASS;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || SMTP_USER;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn(
        "⚠️  SMTP credentials not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env.local"
      );
      // Return success-mock so the UI doesn't break during local dev
      return NextResponse.json({ success: true, mocked: true });
    }

    // ── Create transporter ───────────────────────────────────────────────────
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        // Allow self-signed certs common on cPanel hosts
        rejectUnauthorized: false,
      },
    });

    // ── Build HTML email ─────────────────────────────────────────────────────
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f7f6; margin: 0; padding: 24px; }
            .card { background: #ffffff; border-radius: 16px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .badge { display: inline-block; background: linear-gradient(135deg, #16a34a, #059669); color: #fff; border-radius: 999px; padding: 4px 14px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 20px; }
            h2 { color: #111827; margin: 0 0 20px; font-size: 22px; }
            .field { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; margin-bottom: 14px; }
            .field-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
            .field-value { font-size: 15px; color: #111827; white-space: pre-wrap; word-break: break-word; }
            .footer { margin-top: 28px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">📬 New Contact Message</div>
            <h2>Someone sent you a message via Trash2Treasure</h2>

            <div class="field">
              <div class="field-label">From</div>
              <div class="field-value">${name} &lt;${email}&gt;</div>
            </div>

            <div class="field">
              <div class="field-label">Subject</div>
              <div class="field-value">${subject}</div>
            </div>

            <div class="field">
              <div class="field-label">Message</div>
              <div class="field-value">${message}</div>
            </div>

            <div class="footer">
              Sent via the <strong>Trash2Treasure</strong> Contact Us form &middot;
              ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
            </div>
          </div>
        </body>
      </html>
    `;

    // ── Send email ───────────────────────────────────────────────────────────
    const info = await transporter.sendMail({
      from: `"Trash2Treasure" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      replyTo: `"${name}" <${email}>`,   // replies go straight back to the user
      subject: `[Contact Form] ${subject}`,
      html: htmlContent,
    });

    console.log(`✅ Contact email sent via company SMTP. Message ID: ${info.messageId}`);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("❌ Contact SMTP route failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send contact message." },
      { status: 500 }
    );
  }
}
