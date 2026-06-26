import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch all rewards with redemption counts
 * Query params: ?search=, ?status=, ?category=
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";

    // Fetch all rewards
    let query: any = adminDb.collection("rewards");

    if (status && status !== "All") {
      query = query.where("status", "==", status);
    }

    if (category && category !== "All") {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();
    let rewards = snapshot.docs.map((doc: any) => ({
      reward_id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || doc.data().created_at,
    }));

    // Sort in memory to avoid needing a composite index for where + orderBy
    rewards.sort((a: any, b: any) => {
      const dateA = a.created_at instanceof Date ? a.created_at.getTime() : new Date(a.created_at).getTime();
      const dateB = b.created_at instanceof Date ? b.created_at.getTime() : new Date(b.created_at).getTime();
      return dateB - dateA; // Descending
    });

    // Filter by search (Firestore doesn't support case-insensitive ilike natively without complex setup)
    if (search) {
      const lowerSearch = search.toLowerCase();
      rewards = rewards.filter((r: any) => 
        r.title.toLowerCase().includes(lowerSearch) || 
        r.description.toLowerCase().includes(lowerSearch)
      );
    }

    // Fetch redemption counts per reward
    const redemptionsSnapshot = await adminDb.collection("redemptions").get();
    const redemptions = redemptionsSnapshot.docs.map(doc => doc.data());

    // Build redemption count map
    const redemptionMap = new Map<string, number>();
    redemptions.forEach((r: any) => {
      redemptionMap.set(r.reward_id, (redemptionMap.get(r.reward_id) || 0) + 1);
    });

    // Enhance rewards with redemption counts
    const enhancedRewards = rewards.map((reward: any) => ({
      ...reward,
      redemptions: redemptionMap.get(reward.reward_id) || 0,
    }));

    // Stats
    const totalRewards = enhancedRewards.length;
    const activeRewards = enhancedRewards.filter((r: any) => r.status === "Active").length;
    const totalRedemptions = redemptions.length;

    return NextResponse.json({
      rewards: enhancedRewards,
      stats: {
        totalRewards,
        activeRewards,
        totalRedemptions,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/rewards:", error);
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
 * POST: Create a new reward
 */
export async function POST(req: NextRequest) {
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
    const { title, description, points_required, image_url, status, category, stock } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!points_required || typeof points_required !== "number" || points_required <= 0) {
      return NextResponse.json({ error: "Points required must be a positive number" }, { status: 400 });
    }

    const rewardData = {
      title: title.trim(),
      description: description?.trim() || "",
      points_required,
      image_url: image_url?.trim() || "🎁",
      status: status || "Active",
      category: category?.trim() || "General",
      stock: stock ?? 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const docRef = await adminDb.collection("rewards").add(rewardData);

    return NextResponse.json({ 
        reward: { reward_id: docRef.id, ...rewardData } 
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/admin/rewards:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

