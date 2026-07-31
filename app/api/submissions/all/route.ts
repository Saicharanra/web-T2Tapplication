import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);

    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required", currentRole: session.role }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const filterUserId = searchParams.get("userId");
    const limitNum = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const isCount = searchParams.has("count");

    let query = supabaseAdmin
      .from("waste_submissions")
      .select(
        `
        id, user_id, category, weight, location, latitude, longitude,
        image_url, image_path, points_awarded, status, ai_confidence,
        rejection_reason, notes, verified_at, created_at, updated_at,
        profiles:user_id ( full_name, email )
      `,
        { count: isCount ? "exact" : undefined }
      )
      .order("created_at", { ascending: false });

    if (status) query = (query as any).eq("status", status.toUpperCase());
    if (filterUserId) query = (query as any).eq("user_id", filterUserId);

    if (isCount) {
      const { count, error } = await (query as any).limit(0);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ count: count || 0 });
    }

    const { data, error, count } = await (query as any).range(offset, offset + limitNum - 1);

    if (error) {
      console.error("❌ Error fetching all submissions:", error);
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }

    const shaped = (data || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      wasteType: s.category,
      weight: s.weight,
      location: s.location,
      latitude: s.latitude,
      longitude: s.longitude,
      imageUrl: s.image_url,
      imagePath: s.image_path,
      pointsAwarded: s.points_awarded,
      status: s.status,
      aiConfidence: s.ai_confidence,
      rejectionReason: s.rejection_reason,
      notes: s.notes,
      verifiedAt: s.verified_at,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      user: s.profiles
        ? { id: s.user_id, name: s.profiles.full_name, email: s.profiles.email }
        : null,
    }));

    return NextResponse.json({
      submissions: shaped,
      total: count || shaped.length,
      limit: limitNum,
      offset,
    });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch submissions" }, { status });
  }
}
