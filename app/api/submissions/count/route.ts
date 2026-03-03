import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase client
    const supabase = await createSupabaseServerClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: "User not found in database", details: userError.message },
        { status: 404 }
      );
    }

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required", currentRole: user?.role },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Build query
    let query = supabase
      .from("Submission")
      .select("*", { count: "exact", head: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { count, error } = await query;

    if (error) {
      console.error("❌ Supabase count error:", error);
      return NextResponse.json(
        { error: "Failed to count submissions", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("💥 Server Error:", error);
    return NextResponse.json(
      { error: "Failed to count submissions" },
      { status: 500 }
    );
  }
}