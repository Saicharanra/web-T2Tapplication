import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { OTPEmail } from "@/lib/notifications/templates";
import { sendSmtpEmail } from "@/lib/notifications/sendSmtpEmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Sign-in OTP endpoint — for EXISTING users only.
 * Checks the email exists in User table before sending OTP.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check user exists in Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from("User")
      .select("id, name")
      .eq("email", normalizedEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No account found for this email. Please sign up first." },
        { status: 400 }
      );
    }

    // 2. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 3. Upsert OTP into Supabase OTP table
    const { error: upsertError } = await supabaseAdmin
      .from("OTP")
      .upsert(
        {
          email: normalizedEmail,
          otp,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
        { onConflict: "email" }
      );

    if (upsertError) {
      console.error("❌ Failed to store sign-in OTP:", upsertError);
      return NextResponse.json({ error: "Failed to generate verification code." }, { status: 500 });
    }

    // 4. Send OTP email
    const emailHtml = OTPEmail({ name: user.name, otp });
    const emailResult = await sendSmtpEmail({
      to: normalizedEmail,
      subject: `Trash2Treasure - ${otp} is your sign-in code`,
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
    console.error("❌ Sign-in OTP send failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send sign-in code." },
      { status: 500 }
    );
  }
}
