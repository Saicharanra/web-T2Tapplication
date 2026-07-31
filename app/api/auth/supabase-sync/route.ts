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
    const fullName = (name || "").trim() || normalizedEmail.split("@")[0];

    // 1. Check if user already exists by ID in public.users
    try {
      const { data: userById } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (userById) {
        return NextResponse.json({
          success: true,
          userId: userById.id,
          role: userById.role || "USER",
          level: userById.level || "BRONZE",
          points: userById.points ?? userById.reward_points_balance ?? 0,
        }, { status: 200 });
      }
    } catch (e) {
      console.warn("⚠️ Error checking user by ID:", e);
    }

    // 2. Check by email if email column exists
    try {
      const { data: userByEmail } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (userByEmail) {
        await supabaseAdmin
          .from("users")
          .update({ id })
          .eq("email", normalizedEmail);

        return NextResponse.json({
          success: true,
          userId: id,
          role: userByEmail.role || "USER",
          level: userByEmail.level || "BRONZE",
          points: userByEmail.points ?? userByEmail.reward_points_balance ?? 0,
        }, { status: 200 });
      }
    } catch (e) {
      // Ignore error if email column is absent in users table (relational schema uses profiles table)
    }

    // 3. Upsert into public.profiles if profiles table exists (Unified Master Schema)
    try {
      await supabaseAdmin
        .from("profiles")
        .upsert({
          id,
          email: normalizedEmail,
          full_name: fullName,
          avatar_url: imageUrl || null,
          role: "user",
          status: "active",
        }, { onConflict: "id" });
    } catch (pErr) {
      // Ignored if profiles table does not exist
    }

    // 4. Create user record in public.users (Attempt Flat Schema first, then Unified Master Schema)
    let finalUserRole = "USER";
    let finalUserLevel = "BRONZE";
    let finalUserPoints = 0;

    const { data: newUserFlat, error: flatInsertError } = await supabaseAdmin
      .from("users")
      .insert({
        id,
        name: fullName,
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

    if (!flatInsertError && newUserFlat) {
      finalUserRole = newUserFlat.role || "USER";
      finalUserLevel = newUserFlat.level || "BRONZE";
      finalUserPoints = newUserFlat.points ?? 0;
    } else {
      // Fallback: Attempt Unified Master Schema insert
      try {
        const { data: newUserMaster } = await supabaseAdmin
          .from("users")
          .insert({
            id,
            auth_user_id: id,
            profile_id: id,
            status: "active",
            reward_points_balance: 0,
          })
          .select("*")
          .single();

        if (newUserMaster) {
          finalUserPoints = newUserMaster.reward_points_balance ?? 0;
        }
      } catch (masterInsertErr) {
        console.warn("⚠️ Master schema insert fallback notice:", masterInsertErr);
      }
    }

    // 5. Dispatch Welcome Notification asynchronously
    try {
      await notify({
        userId: id,
        email: normalizedEmail,
        type: "user_created",
        title: "Welcome to Trash2Treasure! 🌍",
        message: "Welcome to Trash2Treasure! Your account has been successfully created. Thank you for joining our eco-friendly movement!",
        emailProps: { name: fullName },
      });
    } catch (notifErr) {
      console.error("⚠️ Failed to dispatch welcome notifications:", notifErr);
    }

    return NextResponse.json({
      success: true,
      userId: id,
      role: finalUserRole,
      level: finalUserLevel,
      points: finalUserPoints,
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Supabase sync route failed:", error);
    // Even if sync route has an unexpected error, return 200 fallback so auth session remains functional
    return NextResponse.json(
      {
        success: true,
        userId: (req as any).body?.id || "unknown",
        role: "USER",
        level: "BRONZE",
        points: 0,
        warning: error.message || "Sync completed with fallback",
      },
      { status: 200 }
    );
  }
}
