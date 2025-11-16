import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Environment variables with proper validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Supabase client for frontend (RLS enabled)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations, create client on demand
export function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return createClient(supabaseUrl!, supabaseServiceKey!);
}


export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: any }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Upload an image to Supabase Storage.
 * @param file - File object from form
 * @param userId - Clerk user ID
 * @param submissionId - UUID for submission
 * @returns Object with publicUrl, storage path, file size, and mimeType
 */
export async function uploadImage(
  file: File,
  userId: string,
  submissionId: string
): Promise<{ publicUrl: string; path: string; size: number; mimeType: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${submissionId}.${fileExt}`;
  const filePath = `submissions/${userId}/${fileName}`;

  // Upload to Supabase Storage
  const adminClient1 = getSupabaseAdmin();
  const { error } = await adminClient1.storage
    .from('waste-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const adminClient2 = getSupabaseAdmin();
  const { data: publicData } = adminClient2.storage
    .from('waste-images')
    .getPublicUrl(filePath);

  return {
    publicUrl: publicData.publicUrl,
    path: filePath,
    size: file.size,
    mimeType: file.type,
  };
}

/**
 * Delete an image from Supabase Storage.
 * @param path - Storage path of the image
 */
export async function deleteImage(path: string): Promise<void> {
  const adminClient = getSupabaseAdmin();
  const { error } = await adminClient.storage
    .from('waste-images')
    .remove([path]);

  if (error) {
    console.error('Delete image error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}
