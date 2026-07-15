import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Registers a new user in Supabase after OTP verification.
 * Called by SignUpClient after successful OTP check.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from("User")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }

    // Generate a Clerk-compatible style ID (using timestamp + random)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Hash the password if provided
    const hashedPassword = password 
      ? require("crypto").createHash("sha256").update(password).digest("hex") 
      : null;

    // Insert new user into Supabase User table
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("User")
      .insert({
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword, // Save hashed password
        role: "USER",
        level: "BRONZE",
        points: 0,
        status: "ACTIVE",
        location: "Not specified",
        imageUrl: null,
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !newUser) {
      console.error("❌ Failed to insert user into Supabase:", insertError);
      return NextResponse.json({ error: "Failed to create user account." }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Register route failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user." },
      { status: 500 }
    );
  }
}
