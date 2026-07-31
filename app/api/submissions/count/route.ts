import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);

    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required", currentRole: session.role },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabaseAdmin
      .from("waste_submissions")
      .select("*", { count: "exact", head: true });

    if (status) query = (query as any).eq("status", status.toUpperCase());

    const { count, error } = await query;

    if (error) {
      console.error("❌ Error counting submissions:", error);
      return NextResponse.json({ error: "Failed to count submissions" }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error: any) {
    const httpStatus = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to count submissions" }, { status: httpStatus });
  }
}
