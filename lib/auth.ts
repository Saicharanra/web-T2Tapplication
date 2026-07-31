import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Verifies the request session using a real Supabase JWT access token.
 * The client sends the Supabase session access_token as a Bearer token.
 * Uses supabaseAdmin.auth.getUser() for cryptographic JWT verification.
 */
export async function verifySession(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing or invalid Authorization header");
  }

  const token = authHeader.split("Bearer ")[1].trim();
  if (!token) {
    throw new Error("Unauthorized: Empty token");
  }

  // 1. Verify the JWT with Supabase Auth (cryptographic check)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    throw new Error("Unauthorized: Invalid or expired session token");
  }

  const userId = user.id;

  // 2. Fetch extended profile from public.profiles (Unified Master Schema)
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, role, status, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      return {
        uid: userId,
        email: profile.email || user.email || "",
        name: profile.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        role: (profile.role || "user").toUpperCase(),
        status: profile.status || "active",
        avatarUrl: profile.avatar_url || null,
      };
    }
  } catch (_) {
    // profiles table may not exist in flat schema — fall through
  }

  // 3. Fallback: try flat public.users table
  try {
    const { data: flatUser } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, level, points, status")
      .eq("id", userId)
      .maybeSingle();

    if (flatUser) {
      return {
        uid: flatUser.id,
        email: flatUser.email || user.email || "",
        name: flatUser.name || user.user_metadata?.full_name || "User",
        role: (flatUser.role || "USER").toUpperCase(),
        level: flatUser.level || "BRONZE",
        points: flatUser.points ?? 0,
        status: flatUser.status || "active",
      };
    }
  } catch (_) {
    // flat schema may differ
  }

  // 4. Auth user exists but no public record yet — return minimal profile from JWT claims
  return {
    uid: userId,
    email: user.email || "",
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
    role: (user.user_metadata?.role || "USER").toUpperCase(),
    level: "BRONZE",
    points: 0,
    status: "active",
  };
}
