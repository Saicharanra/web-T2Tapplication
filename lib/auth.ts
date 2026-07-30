import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Verifies the request session by reading the userId from the Authorization header.
 * Replaces the Firebase Admin verifySession token verification.
 *
 * API routes that were using: verifySession(request) → { uid, email, ... }
 * Now returns the User row from Supabase.
 */
export async function verifySession(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing or invalid Authorization header");
  }

  const userId = authHeader.split("Bearer ")[1].trim();
  if (!userId) {
    throw new Error("Unauthorized: Empty user ID");
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, email, name, role, level, points, status")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new Error("Unauthorized: User not found");
  }

  // Return shape compatible with how verifySession was used (uid + extras)
  return {
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    level: user.level,
    points: user.points,
    status: user.status,
  };
}
