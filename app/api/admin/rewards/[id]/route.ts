import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PUT: Update a reward by ID
 */
export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Admin Role
    const adminUserDoc = await adminDb.collection("users").doc(userId).get();
    if (!adminUserDoc.exists || adminUserDoc.data()?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { title, description, points_required, image_url, status, category, stock } = body;

    // Validation
    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }

    if (points_required !== undefined && (typeof points_required !== "number" || points_required <= 0)) {
      return NextResponse.json({ error: "Points required must be a positive number" }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, any> = {
        updated_at: new Date()
    };
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (points_required !== undefined) updateData.points_required = points_required;
    if (image_url !== undefined) updateData.image_url = image_url.trim();
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category.trim();
    if (stock !== undefined) updateData.stock = stock;

    const rewardRef = adminDb.collection("rewards").doc(id);
    const rewardDoc = await rewardRef.get();

    if (!rewardDoc.exists) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    await rewardRef.update(updateData);

    return NextResponse.json({ 
        reward: { reward_id: id, ...rewardDoc.data(), ...updateData } 
    });
  } catch (error: any) {
    console.error("Error in PUT /api/admin/rewards/[id]:", error);
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
 * DELETE: Delete a reward by ID
 */
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Admin Role
    const adminUserDoc = await adminDb.collection("users").doc(userId).get();
    if (!adminUserDoc.exists || adminUserDoc.data()?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = params;

    await adminDb.collection("rewards").doc(id).delete();

    return NextResponse.json({ message: "Reward deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/admin/rewards/[id]:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
