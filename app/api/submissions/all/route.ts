import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    console.log("🔍 Admin submissions request from user:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase client (awaited headers fix ✅)
    const supabase = await createSupabaseServerClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("role, name, email")
      .eq("id", userId)
      .single();

    if (userError) {
      return NextResponse.json(
        {
          error: "User not found in database",
          details: userError.message,
          userId,
        },
        { status: 404 }
      );
    }

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden: Admin access required",
          currentRole: user?.role,
          userId,
        },
        { status: 403 }
      );
    }

    // Parse filters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const filterUserId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // For count endpoint
    if (searchParams.has("count")) {
      let countQuery = supabase
        .from("Submission")
        .select("*", { count: "exact", head: true });

      if (status) countQuery = countQuery.eq("status", status);
      if (filterUserId) countQuery = countQuery.eq("userId", filterUserId);

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error("❌ Supabase count error:", countError);
        return NextResponse.json(
          { error: "Failed to count submissions", details: countError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ count: count || 0 });
    }

    // Build query for data
    let query = supabase
      .from("Submission")
      .select(
        `
        *,
        user:User!userId(
          id,
          name,
          email,
          level,
          points
        )
      `,
        { count: "exact" }
      )
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (filterUserId) query = query.eq("userId", filterUserId);

    const { data: submissions, error, count } = await query;

    if (error) {
      console.error("❌ Supabase query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch submissions", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      submissions: submissions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("💥 Server Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}