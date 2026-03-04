


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch admin dashboard statistics
 */
export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // Verify Admin Role
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 1. Users Stats
    const { count: totalUsers } = await supabase.from("User").select("*", { count: "exact", head: true });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: newThisWeek } = await supabase.from("User")
      .select("*", { count: "exact", head: true })
      .gte("createdAt", sevenDaysAgo.toISOString());

    // 2. Submission Stats
    const { count: pendingSubmissions } = await supabase.from("Submission").select("*", { count: "exact", head: true }).eq('status', 'PENDING');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: verifiedToday } = await supabase.from("Submission")
      .select("*", { count: "exact", head: true })
      .eq('status', 'VERIFIED')
      .gte("updatedAt", today.toISOString());

    const { count: rejectedToday } = await supabase.from("Submission")
      .select("*", { count: "exact", head: true })
      .eq('status', 'REJECTED')
      .gte("updatedAt", today.toISOString());

    // 3. Points Awarded
    const { data: submissions } = await supabase.from("Submission").select("pointsAwarded").eq('status', 'VERIFIED');
    const totalPoints = submissions?.reduce((acc, curr) => acc + (curr.pointsAwarded || 0), 0) || 0;

    // 4. Recent Submissions Feed
    const { data: recentSubmissions } = await supabase
      .from("Submission")
      .select(`
         id,
         wasteType,
         imageUrl,
         location,
         createdAt,
         status,
         pointsAwarded,
         userId,
         user:User!userId(name, email)
       `)
      .order("createdAt", { ascending: false })
      .limit(6);

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        newThisWeek: newThisWeek || 0,
        pendingSubmissions: pendingSubmissions || 0,
        verifiedToday: verifiedToday || 0,
        rejectedToday: rejectedToday || 0,
        totalPoints,
      },
      recentSubmissions: recentSubmissions || [],
    });
  } catch (error) {
    console.error("💥 Error in admin dashboard route:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
