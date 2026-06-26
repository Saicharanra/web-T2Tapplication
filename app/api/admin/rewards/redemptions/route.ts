import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/notifications/sendEmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch recent reward redemptions with user and reward info
 */
export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin
    const adminUserDoc = await adminDb.collection("users").doc(userId).get();
    if (!adminUserDoc.exists || !["ADMIN","OWNER"].includes(adminUserDoc.data()?.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limitNum = parseInt(searchParams.get("limit") || "20");

    // Fetch redemptions
    const redemptionsSnapshot = await adminDb.collection("redemptions")
      .orderBy("redeemed_at", "desc")
      .limit(limitNum)
      .get();

    // Extract unique reward and user IDs to solve N+1 query problem
    const uniqueRewardIds = Array.from(
      new Set(
        redemptionsSnapshot.docs
          .map(doc => doc.data().reward_id)
          .filter(Boolean)
      )
    );
    const uniqueUserIds = Array.from(
      new Set(
        redemptionsSnapshot.docs
          .map(doc => doc.data().user_id)
          .filter(Boolean)
      )
    );

    // Fetch in parallel using batch getAll
    const rewardRefs = (uniqueRewardIds as string[]).map(id => adminDb.collection("rewards").doc(id));
    const userRefs = (uniqueUserIds as string[]).map(id => adminDb.collection("users").doc(id));

    const [rewardSnapshots, userSnapshots] = await Promise.all([
      rewardRefs.length > 0 ? adminDb.getAll(...rewardRefs) : [],
      userRefs.length > 0 ? adminDb.getAll(...userRefs) : []
    ]);

    const rewardMap = new Map<string, any>();
    rewardSnapshots.forEach(snap => {
      if (snap.exists) {
        rewardMap.set(snap.id, snap.data());
      }
    });

    const userMap = new Map<string, any>();
    userSnapshots.forEach(snap => {
      if (snap.exists) {
        userMap.set(snap.id, snap.data());
      }
    });

    const enrichedRedemptions = redemptionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const rewardData = rewardMap.get(data.reward_id);
      const userData = userMap.get(data.user_id);

      return {
        redemption_id: doc.id,
        reward_id: data.reward_id,
        user_id: data.user_id,
        status: data.status || "PENDING",
        redeemed_at: data.redeemed_at?.toDate?.() || data.redeemed_at,
        reward: rewardData ? {
          title: rewardData.title,
          points_required: rewardData.points_required,
          image_url: rewardData.image_url,
        } : null,
        user: userData ? {
          name: userData.name,
          email: userData.email,
          imageUrl: userData.imageUrl,
        } : null,
      };
    });

    return NextResponse.json({ redemptions: enrichedRedemptions });
  } catch (error: any) {
    console.error("Error in GET /api/admin/rewards/redemptions:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a reward redemption status (e.g., mark as DELIVERED)
 */
export async function PUT(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Admin Role
    const adminUserDoc = await adminDb.collection("users").doc(userId).get();
    if (!adminUserDoc.exists || !["ADMIN","OWNER"].includes(adminUserDoc.data()?.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { redemption_id, status } = body;

    if (!redemption_id || !status) {
      return NextResponse.json({ error: "redemption_id and status are required" }, { status: 400 });
    }

    const redemptionRef = adminDb.collection("redemptions").doc(redemption_id);
    const redemptionDoc = await redemptionRef.get();

    if (!redemptionDoc.exists) {
      return NextResponse.json({ error: "Redemption not found" }, { status: 404 });
    }

    const redemptionData = redemptionDoc.data()!;
    const oldStatus = redemptionData.status || "PENDING";

    // Avoid duplicate processing if already marked as DELIVERED
    if (oldStatus === "DELIVERED" && status === "DELIVERED") {
      return NextResponse.json({ message: "Redemption is already marked as DELIVERED." });
    }

    // Update status
    await redemptionRef.update({
      status,
      updated_at: new Date()
    });

    // Trigger Reward Delivered Notification and Email if status becomes DELIVERED
    if (status === "DELIVERED") {
      try {
        const recipientId = redemptionData.user_id;
        const rewardId = redemptionData.reward_id;

        const [recipientDoc, rewardDoc] = await Promise.all([
          adminDb.collection("users").doc(recipientId).get(),
          adminDb.collection("rewards").doc(rewardId).get()
        ]);

        const recipientData = recipientDoc.exists ? recipientDoc.data() : null;
        const rewardData = rewardDoc.exists ? rewardDoc.data() : null;

        if (recipientData && recipientData.email && rewardData) {
          const email = recipientData.email;
          const name = recipientData.name || "Eco Partner";
          const rewardTitle = rewardData.title || "Eco Reward";
          const pointsRequired = rewardData.points_required || 0;

          // A: Log In-App Notification
          await adminDb.collection("notifications").add({
            userId: recipientId,
            email,
            type: "reward_delivered",
            title: "Reward Delivered 🎁",
            message: `Congratulations! Your reward "${rewardTitle}" has been successfully delivered.`,
            read: false,
            createdAt: new Date(),
          });

          // B: Send Resend Email
          await sendEmail(email, "Eco-Gift Delivered! 🎁", "delivered", {
            name,
            rewardName: rewardTitle,
            pointsCost: pointsRequired,
          });
        }
      } catch (notifErr) {
        console.error("⚠️ Failed to dispatch post-delivery notifications:", notifErr);
      }
    }

    return NextResponse.json({ message: "Redemption status updated successfully!" });
  } catch (error: any) {
    console.error("Error in PUT /api/admin/rewards/redemptions:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

