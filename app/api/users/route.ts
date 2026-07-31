import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);

    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { data: users, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id, email, full_name, role, status, avatar_url, created_at,
        waste_submissions ( id )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const shaped = (users || []).map((u: any) => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: u.role,
      status: u.status,
      avatarUrl: u.avatar_url,
      joinedAt: u.created_at,
      submissions: { count: (u.waste_submissions || []).length },
    }));

    return NextResponse.json(shaped);
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status });
  }
}
