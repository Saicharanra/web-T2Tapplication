import { supabaseAdmin } from "@/lib/supabase-server";

export const REWARD_AMOUNTS = {
  ADD_BIN: 50,
  VERIFY_BIN: 10,
  REPORT_BIN: 5,
};

/**
 * Awards points to a user for community contributions.
 * Updates User.points and inserts a PointsHistory record.
 * Replaces the Firestore transaction in lib/firebase/rewards.ts.
 */
export async function rewardUserPoints(
  userId: string,
  pointsToAdd: number,
  actionType: "add" | "verify" | "report",
  binId: string
): Promise<void> {
  if (!userId) return;

  const actionReason =
    actionType === "add"
      ? "Added new recycling bin location"
      : actionType === "verify"
      ? "Verified a community recycling bin"
      : "Reported invalid recycling bin location";

  try {
    // 1. Fetch current user points
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("User")
      .select("points")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      console.error("❌ rewardUserPoints: user not found", fetchError);
      throw new Error("User not found");
    }

    const newPoints = (user.points || 0) + pointsToAdd;

    // 2. Update user points
    const { error: updateError } = await supabaseAdmin
      .from("User")
      .update({ points: newPoints, updatedAt: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ rewardUserPoints: update failed", updateError);
      throw new Error(updateError.message);
    }

    // 3. Insert points history record
    const { error: historyError } = await supabaseAdmin
      .from("PointsHistory")
      .insert({
        userId,
        submissionId: `bin_${actionType}_${binId}`,
        points: pointsToAdd,
        description: actionReason,
        createdAt: new Date().toISOString(),
      });

    if (historyError) {
      console.warn("⚠️ PointsHistory insert failed (non-critical):", historyError);
    }

    console.log(`✅ Rewarded ${pointsToAdd} points to user ${userId} for bin action: ${actionType}`);
  } catch (error) {
    console.error("❌ rewardUserPoints failed:", error);
    throw error;
  }
}
