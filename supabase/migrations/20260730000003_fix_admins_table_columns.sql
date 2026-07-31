-- ============================================================
-- FIX: Add compatibility columns to public.admins table
-- Solves: ERROR 42703: column admins.email does not exist
-- ============================================================

ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'super_admin';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;

-- Populate email and name from linked profiles
UPDATE public.admins a
SET 
  email = COALESCE(a.email, p.email),
  name = COALESCE(a.name, p.full_name)
FROM public.profiles p
WHERE (a.profile_id = p.id OR a.auth_user_id = p.id) AND (a.email IS NULL OR a.name IS NULL);
