import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// DELETE: Delete a submission (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get the submission first to find the image path
    const { data: submission, error: fetchError } = await supabase
      .from("Submission")
      .select("id, imagePath, imageUrl")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Delete the image from Supabase Storage if imagePath exists
    if (submission.imagePath) {
      try {
        const adminClient = getSupabaseAdmin();
        const { error: storageError } = await adminClient.storage
          .from("waste-images")
          .remove([submission.imagePath]);

        if (storageError) {
          console.error("⚠️ Failed to delete image from storage:", storageError);
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log("✅ Image deleted from storage:", submission.imagePath);
        }
      } catch (storageErr) {
        console.error("⚠️ Storage deletion error:", storageErr);
      }
    }

    // Delete the submission from the database
    const { error: deleteError } = await supabase
      .from("Submission")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("❌ Failed to delete submission:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete submission", details: deleteError.message },
        { status: 500 }
      );
    }

    console.log("✅ Submission deleted:", id);
    return NextResponse.json(
      { message: "Submission deleted successfully", id },
      { status: 200 }
    );
  } catch (error) {
    console.error("💥 Server Error:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}
