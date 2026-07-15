import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
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

    // 1. Check if email is already registered in Supabase User table
    const { data: existingUser } = await supabaseAdmin
      .from("User")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "This email address is already registered. Please sign in instead." },
        { status: 400 }
      );
    }

    // 2. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // 3. Upsert OTP into Supabase OTP table (one record per email)
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
      console.error("❌ Failed to store OTP in Supabase:", upsertError);
      return NextResponse.json({ error: "Failed to generate verification code." }, { status: 500 });
    }

    // 4. Build and send the OTP email
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
