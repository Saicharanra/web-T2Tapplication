import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const submissionId = crypto.randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Supabase Storage Upload
    console.log(`🚀 Uploading file to Supabase Storage (waste-images)...`);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const imagePath = `${userId}/${submissionId}.${fileExtension}`;

    let { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("waste-images")
      .upload(imagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError && (uploadError.message?.toLowerCase().includes("bucket") || uploadError.message?.toLowerCase().includes("not found"))) {
      console.warn("⚠️ 'waste-images' bucket missing or unaccessible, attempting auto-creation...");
      try {
        await supabaseAdmin.storage.createBucket("waste-images", { public: true });
        const retry = await supabaseAdmin.storage
          .from("waste-images")
          .upload(imagePath, buffer, {
            contentType: file.type,
            upsert: true,
          });
        uploadData = retry.data;
        uploadError = retry.error;
      } catch (createErr) {
        console.warn("⚠️ Auto-create bucket error:", createErr);
      }
    }

    if (uploadError) {
      console.error("❌ Supabase Storage upload error:", uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("waste-images")
      .getPublicUrl(imagePath);
    const publicUrl = urlData.publicUrl;

    console.log(`✅ Upload successful: ${publicUrl}`);

    return NextResponse.json(
      {
        success: true,
        imageUrl: publicUrl,
        imagePath: imagePath,
        submissionId,
        fileSize: file.size,
        mimeType: file.type,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error uploading image:", error);
    
    let errorMessage = "Failed to upload image";
    let status = 500;

    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message.includes('bucket') || error.message.includes('storage')) {
      errorMessage = "Supabase Storage configuration error. Please check your waste-images bucket.";
      status = 500;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message
      },
      { status }
    );
  }
}

