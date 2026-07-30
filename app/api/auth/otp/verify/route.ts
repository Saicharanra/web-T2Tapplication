import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

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

    // 1. Fetch OTP record from Supabase
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from("otp_codes")
      .select("code, expires_at")
      .eq("email", normalizedEmail)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: "Verification code is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 2. Validate expiration
    const expiryDate = new Date(otpRecord.expires_at);
    if (new Date() > expiryDate) {
      // Clean up expired OTP
      await supabaseAdmin.from("otp_codes").delete().eq("email", normalizedEmail);
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 3. Match code
    if (otpRecord.code !== enteredOtp) {
      return NextResponse.json(
        { error: "The verification code you entered is incorrect." },
        { status: 400 }
      );
    }

    // 4. Verification successful — clean up OTP from Supabase
    await supabaseAdmin.from("otp_codes").delete().eq("email", normalizedEmail);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Verify OTP route failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify OTP." },
      { status: 500 }
    );
  }
}
