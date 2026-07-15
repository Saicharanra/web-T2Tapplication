import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Authenticates a user using email and password.
 * Checks against the User table in Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch user from Supabase by email
    const { data: user, error } = await supabaseAdmin
      .from("User")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    }

    // 2. Hash input password and compare with stored hashed password
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    if (user.password !== hashedPassword) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      name: user.name,
      email: user.email,
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Sign in route failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sign in." },
      { status: 500 }
    );
  }
}
