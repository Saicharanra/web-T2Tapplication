import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    // Check if user is admin
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || userDoc.data()?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = params;

    // Get the submission first to find the image path (public_id)
    const submissionRef = adminDb.collection("submissions").doc(id);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const submissionData = submissionDoc.data()!;

    // Delete the image from Cloudinary if imagePath exists
    if (submissionData.imagePath) {
      try {
        console.log(`🗑️ Deleting image ${submissionData.imagePath} from Cloudinary...`);
        await cloudinary.uploader.destroy(submissionData.imagePath);
        console.log("✅ Image deleted from Cloudinary");
      } catch (cloudinaryErr) {
        console.error("⚠️ Cloudinary deletion error:", cloudinaryErr);
      }
    }

    // Delete the submission from Firestore
    await submissionRef.delete();

    console.log("✅ Submission deleted:", id);
    return NextResponse.json(
      { message: "Submission deleted successfully", id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("💥 Server Error:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}
