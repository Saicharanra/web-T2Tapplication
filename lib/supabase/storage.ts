import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Uploads a recycling bin photograph to Supabase Storage (bin-images bucket)
 * and returns the public download URL.
 * Falls back gracefully to Unsplash placeholders if upload fails.
 */
export async function uploadBinImage(file: File, userId: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const storagePath = `bins/${userId}_${timestamp}_${cleanFileName}`;

    // Convert File to ArrayBuffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from("bin-images")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error || !data) {
      throw new Error(error?.message || "Upload failed");
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("bin-images")
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error) {
    console.warn("Supabase Storage upload failed, using placeholder:", error);

    // Fallback to Unsplash recycling placeholders
    const unsplashTemplates = [
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80",
    ];
    return unsplashTemplates[Math.floor(Math.random() * unsplashTemplates.length)];
  }
}
