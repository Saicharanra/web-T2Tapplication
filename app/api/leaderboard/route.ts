import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { calculateDailyStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    const userId = session?.uid;

    // 1. Fetch profiles table cleanly (only regular users)
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, created_at");

    if (profErr) {
      console.warn("⚠️ Could not fetch profiles table:", profErr);
    }

    // Include only users with role === 'USER' (ignoring admins, owners, businesses)
    const rawProfiles = (profiles || []).filter((p: any) => {
      const userRole = (p.role || "USER").toUpperCase();
      return userRole === "USER";
    });

    // 2. Fetch users table for points/level if available
    const pointsMap = new Map<string, number>();
    const levelMap = new Map<string, string>();
    try {
      const { data: usersData } = await supabaseAdmin
        .from("users")
        .select("id, points, level");
      
      (usersData || []).forEach((u: any) => {
        if (u.id) {
          pointsMap.set(u.id, Number(u.points) || 0);
          if (u.level) levelMap.set(u.id, u.level);
        }
      });
    } catch (e) {
      console.warn("⚠️ Could not fetch users table for points:", e);
    }

    // 3. Batch fetch waste_submissions for earned points, counts, and streak dates
    const { data: allSubs } = await supabaseAdmin
      .from("waste_submissions")
      .select("user_id, category, points_awarded, status, created_at");

    const subCountMap = new Map<string, number>();
    const subPointsMap = new Map<string, number>();
    const datesMap = new Map<string, string[]>();

    (allSubs || []).forEach((s: any) => {
      if (!s.user_id) return;

      // Count submissions
      subCountMap.set(s.user_id, (subCountMap.get(s.user_id) || 0) + 1);

      // Submission dates for streak
      if (s.created_at) {
        const uDates = datesMap.get(s.user_id) || [];
        uDates.push(s.created_at);
        datesMap.set(s.user_id, uDates);
      }

      // Submission points if verified/approved
      const st = (s.status || "").toUpperCase();
      if (st === "VERIFIED" || st === "APPROVED" || st === "ACCEPTED") {
        const pts = Number(s.points_awarded) || 15;
        subPointsMap.set(s.user_id, (subPointsMap.get(s.user_id) || 0) + pts);
      }
    });

    // 4. Merge profiles into leaderboard user objects
    const mergedUsers: any[] = rawProfiles.map((p: any) => {
      const uId = p.id;
      const basePoints = pointsMap.get(uId) || 0;
      const subPoints = subPointsMap.get(uId) || 0;
      const totalPoints = Math.max(basePoints, subPoints);

      let level = levelMap.get(uId) || "BRONZE";
      if (totalPoints >= 5000) level = "PLATINUM";
      else if (totalPoints >= 1000) level = "GOLD";
      else if (totalPoints >= 250) level = "SILVER";

      return {
        id: uId,
        name: p.full_name || p.email?.split("@")[0] || "Eco Warrior",
        email: p.email || "",
        avatarUrl: p.avatar_url || null,
        points: totalPoints,
        level,
        joinedAt: p.created_at,
        submissions: subCountMap.get(uId) || 0,
        streak: calculateDailyStreak(datesMap.get(uId) || []),
      };
    });

    // Sort by points desc
    mergedUsers.sort((a, b) => b.points - a.points);

    // Assign rank indices
    const rankedUsers = mergedUsers.map((u, idx) => {
      const nameParts = (u.name || "??").split(" ");
      const initials = nameParts.map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
      return {
        rank: idx + 1,
        ...u,
        avatar: u.avatarUrl || initials,
      };
    });

    const top50 = rankedUsers.slice(0, 50);

    // Find current user's dynamic rank
    let currentUser: any = null;
    if (userId) {
      currentUser = rankedUsers.find(u => u.id === userId) || null;
      if (!currentUser) {
        // Fallback profile if current user is not in top profiles
        currentUser = {
          rank: rankedUsers.length + 1,
          id: userId,
          name: "You",
          email: "",
          avatarUrl: null,
          avatar: "YOU",
          points: subPointsMap.get(userId) || 0,
          level: "BRONZE",
          submissions: subCountMap.get(userId) || 0,
          streak: calculateDailyStreak(datesMap.get(userId) || []),
          joinedAt: new Date().toISOString(),
        };
      }
    }

    return NextResponse.json({
      leaderboard: top50,
      currentUser,
      total: rankedUsers.length,
    });
  } catch (error: any) {
    console.error("❌ Error fetching leaderboard:", error);
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch leaderboard" }, { status });
  }
}
