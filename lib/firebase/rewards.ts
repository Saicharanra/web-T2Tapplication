import { db } from "@/lib/firebase-client";
import { doc, collection, addDoc, serverTimestamp, runTransaction } from "firebase/firestore";

export const REWARD_AMOUNTS = {
  ADD_BIN: 50,
  VERIFY_BIN: 10,
  REPORT_BIN: 5,
};

/**
 * Atomically rewards a user with points for community contributions
 * and appends a record in the points history log.
 */
export async function rewardUserPoints(
  userId: string,
  pointsToAdd: number,
  actionType: "add" | "verify" | "report",
  binId: string
) {
  if (!userId) return;

  const userRef = doc(db, "users", userId);
  const pointsHistoryRef = collection(db, "pointsHistory");

  try {
    // 1. Transactionally update user points balance
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        console.warn(`User profile [${userId}] not created in Firestore yet. Creating simple doc.`);
        transaction.set(userRef, {
          points: pointsToAdd,
          role: "USER",
          level: "BRONZE",
          status: "ACTIVE",
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        return;
      }

      const currentPoints = userDoc.data().points || 0;
      const newPoints = currentPoints + pointsToAdd;

      transaction.update(userRef, {
        points: newPoints,
        updatedAt: serverTimestamp(),
      });
    });

    // 2. Add log to PointsHistory
    const actionReason = actionType === "add" 
      ? `Added new recycling bin location` 
      : actionType === "verify" 
      ? `Verified a community recycling bin`
      : `Reported invalid recycling bin location`;

    await addDoc(pointsHistoryRef, {
      userId,
      submissionId: `bin_${actionType}_${binId}`,
      points: pointsToAdd,
      description: actionReason,
      createdAt: serverTimestamp(),
    });

    console.log(`Successfully rewarded ${pointsToAdd} points to user ${userId} for bin action: ${actionType}`);
  } catch (error) {
    console.error("Failed to reward points in Firestore transaction:", error);
    throw error;
  }
}
