import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP code are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const enteredOtp = otp.trim();

    if (!adminDb) {
      console.warn("⚠️ Firebase Admin DB is not initialized. Permitting verification in development.");
      return NextResponse.json({ success: true, mocked: true });
    }

    // 1. Fetch OTP from Firestore
    const otpDocRef = adminDb.collection("otps").doc(normalizedEmail);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json(
        { error: "Verification code is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const data = otpDoc.data();
    if (!data) {
      return NextResponse.json({ error: "No verification data found." }, { status: 400 });
    }

    const { otp: storedOtp, expiresAt } = data;

    // 2. Validate expiration
    const expiryDate = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    if (new Date() > expiryDate) {
      // Clean up expired OTP
      await otpDocRef.delete();
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 3. Match code
    if (storedOtp !== enteredOtp) {
      return NextResponse.json(
        { error: "The verification code you entered is incorrect." },
        { status: 400 }
      );
    }

    // 4. Verification successful, clean up OTP from Firestore
    await otpDocRef.delete();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Verify OTP route failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify OTP." },
      { status: 500 }
    );
  }
}
