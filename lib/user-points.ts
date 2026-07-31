import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Calculates total user points across all Supabase tables
 * (users, reward_points, points_history, and approved waste_submissions).
 */
export async function getUserTotalPoints(userId: string) {
  try {
    // 1. Fetch user row in public.users
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("points, reward_points_balance, total_rewards_earned")
      .or(`id.eq.${userId},auth_user_id.eq.${userId},profile_id.eq.${userId}`)
      .maybeSingle();

    const userTablePts = Math.max(
      Number(userRow?.points ?? 0),
      Number(userRow?.reward_points_balance ?? 0),
      Number(userRow?.total_rewards_earned ?? 0)
    );

    // 2. Fetch reward_points table
    const { data: rewardPtsRow } = await supabaseAdmin
      .from("reward_points")
      .select("points_balance, lifetime_earned")
      .or(`profile_id.eq.${userId}`)
      .maybeSingle();

    const rewardPts = Math.max(
      Number(rewardPtsRow?.points_balance ?? 0),
      Number(rewardPtsRow?.lifetime_earned ?? 0)
    );

    // 3. Sum earned points from points_history
    const { data: history } = await supabaseAdmin
      .from("points_history")
      .select("points, transaction_type")
      .eq("user_id", userId);

    let historyEarned = 0;
    let historyRedeemed = 0;

    (history || []).forEach((row: any) => {
      const p = Number(row.points) || 0;
      const type = (row.transaction_type || "").toUpperCase();
      if (type === "EARNED" || type === "BONUS" || type === "WASTE_VERIFIED" || type === "CREDIT") {
        historyEarned += p;
      } else if (type === "REDEEMED" || type === "DEBIT") {
        historyRedeemed += Math.abs(p);
      }
    });

    const netHistoryPoints = Math.max(0, historyEarned - historyRedeemed);

    // 4. Sum approved waste_submissions points
    const { data: verifiedSubs } = await supabaseAdmin
      .from("waste_submissions")
      .select("points_awarded, points_earned, status")
      .eq("user_id", userId);

    let submissionPoints = 0;
    (verifiedSubs || []).forEach((sub: any) => {
      const st = (sub.status || "").toLowerCase();
      if (st === "approved" || st === "verified") {
        const p = Number(sub.points_awarded ?? sub.points_earned ?? 15);
        submissionPoints += p;
      }
    });

    const netSubmissionPoints = Math.max(0, submissionPoints - historyRedeemed);

    // Take the maximum valid points calculated across all sources
    const finalTotalPoints = Math.max(
      userTablePts,
      rewardPts,
      netHistoryPoints,
      netSubmissionPoints
    );

    return {
      totalPoints: finalTotalPoints,
      historyEarned,
      historyRedeemed,
      submissionPoints,
    };
  } catch (error) {
    console.error("Error calculating user points:", error);
    return { totalPoints: 0, historyEarned: 0, historyRedeemed: 0, submissionPoints: 0 };
  }
}
