import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    const userId = session.uid;

    // Fetch all users with points for leaderboard ranking
    const { data: users, error: usersErr } = await supabaseAdmin
      .from("profiles")
      .select(`
        id, full_name, email, avatar_url, created_at,
        users:id ( points, level )
      `)
      .order("created_at", { ascending: true });

    if (usersErr) {
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }

    // Merge and sort by points desc
    const merged: any[] = (users || []).map((u: any) => ({
      id: u.id,
      name: u.full_name || "Eco Warrior",
      email: u.email || "",
      avatarUrl: u.avatar_url || null,
      points: Number((u.users as any)?.points) || 0,
      level: (u.users as any)?.level || "BRONZE",
      joinedAt: u.created_at,
    }));

    merged.sort((a: any, b: any) => b.points - a.points);

    // Enrich top users with submission counts
    const top50 = merged.slice(0, 50);
    const currentUserIdx = merged.findIndex((u: any) => u.id === userId);
    let currentUser: any = currentUserIdx !== -1 ? { ...merged[currentUserIdx], rank: currentUserIdx + 1 } : null;

    const usersToEnrich = [...top50];
    if (currentUser && !top50.find((u: any) => u.id === userId)) {
      usersToEnrich.push(currentUser);
    }

    // Batch fetch submission counts
    const userIds = usersToEnrich.map((u: any) => u.id);
    const { data: subCounts } = await supabaseAdmin
      .from("waste_submissions")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "VERIFIED");

    const countMap = new Map<string, number>();
    (subCounts || []).forEach((s: any) => {
      countMap.set(s.user_id, (countMap.get(s.user_id) || 0) + 1);
    });

    const fullLeaderboard = top50.map((user, index) => {
      const nameParts = (user.name || "??").split(" ");
      const initials = nameParts.map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
      return {
        rank: index + 1,
        ...user,
        submissions: countMap.get(user.id) || 0,
        avatar: initials,
      };
    });

    if (currentUser) {
      const nameParts = (currentUser.name || "??").split(" ");
      currentUser.avatar = nameParts.map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
      currentUser.submissions = countMap.get(currentUser.id) || 0;
    }

    return NextResponse.json({
      leaderboard: fullLeaderboard,
      currentUser,
      total: merged.length,
    });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch leaderboard" }, { status });
  }
}
