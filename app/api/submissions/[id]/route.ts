import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  try {
    const session = await verifySession(req);

    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Fetch submission to get image path before deletion
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from("waste_submissions")
      .select("id, image_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Delete image from Supabase Storage if path exists
    if (submission.image_path) {
      try {
        const { error: storageErr } = await supabaseAdmin.storage
          .from("waste-images")
          .remove([submission.image_path]);
        if (storageErr) throw storageErr;
        console.log("✅ Image deleted from Supabase Storage");
      } catch (storageErr) {
        console.warn("⚠️ Supabase Storage deletion error:", storageErr);
      }
    }

    // Delete the submission record
    const { error: deleteError } = await supabaseAdmin
      .from("waste_submissions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("❌ Error deleting submission:", deleteError);
      return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
    }

    console.log("✅ Submission deleted:", id);
    return NextResponse.json({ message: "Submission deleted successfully", id }, { status: 200 });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to delete submission" }, { status });
  }
}
