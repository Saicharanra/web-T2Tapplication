-- ========================================================
-- Trash2Treasure (T2T) - User Application Database Schema
-- Migration: 01_user_portal_schema.sql
-- Path: web/web-T2Tapplication/supabase/migrations/
-- ========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE (Linked 1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'BUSINESS', 'SUPER_ADMIN')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  level TEXT NOT NULL DEFAULT 'BRONZE' CHECK (level IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  waste_submitted DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (waste_submitted >= 0),
  location TEXT,
  city TEXT,
  state TEXT,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SMART BINS TABLE
CREATE TABLE IF NOT EXISTS public.bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'Public',
  capacity DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  fill_percentage DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Full', 'Maintenance', 'Inactive')),
  photo_url TEXT,
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  last_cleared TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WASTE SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.waste_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bin_id UUID REFERENCES public.bins(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  weight DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  location TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL DEFAULT '',
  image_size INTEGER,
  image_mime_type TEXT,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  ai_confidence DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  assigned_admin_id UUID,
  rejection_reason TEXT,
  notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. POINTS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.waste_submissions(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'EARNED' CHECK (transaction_type IN ('EARNED', 'REDEEMED', 'BONUS', 'REFUNDED')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT,
  type TEXT NOT NULL DEFAULT 'GENERAL',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. OTP CODES TABLE
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR USER DOMAIN
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_waste_user ON public.waste_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_status ON public.waste_submissions(status);
CREATE INDEX IF NOT EXISTS idx_waste_created ON public.waste_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_user ON public.points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_bins_location ON public.bins(latitude, longitude);
