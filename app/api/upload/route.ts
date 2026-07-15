import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";
import cloudinary from "@/lib/cloudinary";

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
    
    // Cloudinary Upload
    console.log(`🚀 Uploading file to Cloudinary...`);
    
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `submissions/${userId}`,
            public_id: submissionId,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              console.error("❌ Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(buffer);
      });
    };

    const cloudinaryResult = (await uploadToCloudinary()) as any;
    const publicUrl = cloudinaryResult.secure_url;
    const imagePath = cloudinaryResult.public_id;

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

    if (error.message.includes('Must provide')) {
      errorMessage = "Cloudinary configuration error. Please check your environment variables.";
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

