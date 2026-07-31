import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser-side Supabase client (uses anon key + manages session in cookies)
const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches a URL with the Supabase JWT access_token as an Authorization header.
 * Replaces the old localStorage userId-based fetchWithAuth.
 * Automatically reads the active Supabase session for the current user.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  try {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  } catch (err) {
    console.warn("⚠️ Could not read Supabase session for fetchWithAuth:", err);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
