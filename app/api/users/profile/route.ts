import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getUserTotalPoints } from "@/lib/user-points";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    const userId = session.uid;

    // Fetch profile + user points
    const [{ data: profile }, { totalPoints }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, role, status, avatar_url, created_at")
        .eq("id", userId)
        .maybeSingle(),
      getUserTotalPoints(userId),
    ]);

    if (!profile) {
      return NextResponse.json({
        id: userId,
        name: session.name,
        email: session.email,
        role: session.role || "USER",
        level: "BRONZE",
        points: totalPoints,
        totalPoints,
        status: "active",
      });
    }

    let level = "BRONZE";
    if (totalPoints >= 5000) level = "PLATINUM";
    else if (totalPoints >= 1000) level = "GOLD";
    else if (totalPoints >= 250) level = "SILVER";

    return NextResponse.json({
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: (profile.role || "user").toUpperCase(),
      status: profile.status,
      avatarUrl: profile.avatar_url,
      joinedAt: profile.created_at,
      level,
      points: totalPoints,
      totalPoints,
    });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifySession(req);
    const userId = session.uid;

    const body = await req.json();
    const { name, avatarUrl, phone, city, state } = body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.full_name = name;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
    if (phone !== undefined) updates.phone = phone;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;

    const { data: updated, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update profile", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status });
  }
}
