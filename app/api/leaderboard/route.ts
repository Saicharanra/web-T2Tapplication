import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase client
    const supabase = await createSupabaseServerClient();

    // Fetch top users ordered by points
    const { data: leaderboard, error } = await supabase
      .from("User")
      .select("id, name, email, points, level, updatedAt")
      .eq("status", "ACTIVE")
      .order("points", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ Leaderboard query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch leaderboard", details: error.message },
        { status: 500 }
      );
    }

    // Count total submissions per user
    const userIds = leaderboard?.map((u) => u.id) || [];
    
    const { data: submissionCounts, error: submissionError } = await supabase
      .from("Submission")
      .select("userId")
      .in("userId", userIds);

    if (submissionError) {
      console.error("❌ Submission count error:", submissionError);
    }

    // Calculate submission counts
    const submissionMap = new Map<string, number>();
    submissionCounts?.forEach((sub) => {
      submissionMap.set(sub.userId, (submissionMap.get(sub.userId) || 0) + 1);
    });

    // Enhance leaderboard with submission counts and rank
    const enhancedLeaderboard = leaderboard?.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name || "Unknown User",
      email: user.email,
      points: user.points,
      level: user.level,
      submissions: submissionMap.get(user.id) || 0,
      avatar: user.name
        ? user.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "??",
      joinedAt: user.updatedAt,
    })) || [];

    // Find current user's rank
    const currentUserRank = enhancedLeaderboard.findIndex((u) => u.id === userId);
    const currentUser = currentUserRank >= 0 ? {
      ...enhancedLeaderboard[currentUserRank],
      rank: currentUserRank + 1,
    } : null;

    return NextResponse.json({
      leaderboard: enhancedLeaderboard,
      currentUser,
      total: enhancedLeaderboard.length,
    });
  } catch (error) {
    console.error("💥 Leaderboard Server Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
