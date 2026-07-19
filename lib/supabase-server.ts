import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (typeof window === 'undefined' && (!supabaseUrl || !supabaseServiceRoleKey)) {
  console.warn('Supabase server: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Server-side Supabase client with service role key.
 * Bypasses Row Level Security — use ONLY in API routes (server-side only).
 */
export const supabaseAdmin = (typeof window === 'undefined' && supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null as any;
