import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { OTPEmail } from "@/lib/notifications/templates";
import { sendSmtpEmail } from "@/lib/notifications/sendSmtpEmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email } = body;

    if (!email || !name) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user already exists in Firebase Auth
    if (adminAuth) {
      try {
        const userRecord = await adminAuth.getUserByEmail(normalizedEmail);
        if (userRecord) {
          return NextResponse.json(
            { error: "This email address is already registered. Please sign in instead." },
            { status: 400 }
          );
        }
      } catch (authError: any) {
        if (authError.code !== "auth/user-not-found") {
          console.error("Firebase Admin Auth error check:", authError);
          return NextResponse.json(
            { error: "Error checking user existence." },
            { status: 500 }
          );
        }
      }
    }

    // 2. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // 3. Save OTP in Firestore collection 'otps'
    if (adminDb) {
      await adminDb.collection("otps").doc(normalizedEmail).set({
        otp,
        createdAt: new Date(),
        expiresAt,
      });
    } else {
      console.warn("⚠️ Firebase Admin DB is not initialized. Storing OTP skipped.");
    }

    // 4. Build and send the email
    const emailHtml = OTPEmail({ name, otp });
    const emailResult = await sendSmtpEmail({
      to: normalizedEmail,
      subject: `Trash2Treasure - ${otp} is your verification code`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Send OTP route failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process OTP verification request." },
      { status: 500 }
    );
  }
}
