import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { notify } from "@/lib/notifications/notify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Endpoint to sync Supabase Auth users (both Email/Password and OAuth) into the public User table in Supabase.
 * Bypasses RLS to search, insert, and update user records.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, imageUrl } = body;

    if (!id || !email) {
      return NextResponse.json({ error: "User ID and email are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user already exists by ID
    const { data: userById, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (userById) {
      return NextResponse.json({
        success: true,
        userId: userById.id,
        role: userById.role,
        level: userById.level,
        points: userById.points,
      }, { status: 200 });
    }

    // 2. Check if user exists by email (could be created via legacy migration or pre-existing records)
    const { data: userByEmail } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userByEmail) {
      // Update the user's ID to their Supabase Auth UUID so that auth states match.
      const { error: updateIdError } = await supabaseAdmin
        .from("users")
        .update({ id })
        .eq("email", normalizedEmail);

      if (!updateIdError) {
        return NextResponse.json({
          success: true,
          userId: id,
          role: userByEmail.role,
          level: userByEmail.level,
          points: userByEmail.points,
        }, { status: 200 });
      }

      return NextResponse.json({
        success: true,
        userId: userByEmail.id,
        role: userByEmail.role,
        level: userByEmail.level,
        points: userByEmail.points,
      }, { status: 200 });
    }

    // 3. New user - create them in the Supabase public users table
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id,
        name: (name || "").trim() || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: "USER",
        level: "BRONZE",
        points: 0,
        status: "Active",
        location: "Not specified",
        avatar_url: imageUrl || null,
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (insertError || !newUser) {
      console.error("❌ Failed to insert Supabase user into public User table:", insertError);
      return NextResponse.json({ error: "Failed to create user account." }, { status: 500 });
    }

    // 4. Dispatch Welcome Notification
    try {
      await notify({
        userId: id,
        email: normalizedEmail,
        type: "user_created",
        title: "Welcome to Trash2Treasure! 🌍",
        message: "Welcome to Trash2Treasure! Your account has been successfully created. Thank you for joining our eco-friendly movement!",
        emailProps: { name: (name || "").trim() || "Member" },
      });
    } catch (notifErr) {
      console.error("⚠️ Failed to dispatch welcome notifications:", notifErr);
    }

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      role: newUser.role,
      level: newUser.level,
      points: newUser.points,
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Supabase sync route failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synchronize Supabase user." },
      { status: 500 }
    );
  }
}
