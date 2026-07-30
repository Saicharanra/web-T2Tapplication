-- ==============================================================================
-- TRASH2TREASURE (T2T) MASTER CONSOLIDATED DATABASE SETUP
-- Single unified PostgreSQL schema for User App, Admin Panel, & Business Portal
-- Compatible with Native Supabase Auth (auth.users UUIDs)
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS & PREREQUISITES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==============================================================================
-- 2. CORE TABLE DEFINITIONS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 2.1 USER DOMAIN: public.users (1-to-1 with auth.users)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2.2 ADMIN DOMAIN: public.admins
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'operations', 'support', 'finance')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_until TIMESTAMPTZ,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 2.3 BUSINESS DOMAIN: public.businesses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  business_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  business_type VARCHAR(100),
  category VARCHAR(100) DEFAULT 'General',
  gst_number VARCHAR(50),
  business_registration_number VARCHAR(100),
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pincode VARCHAR(20),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  logo_url TEXT,
  cover_image TEXT,
  revenue DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  approved_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 2.4 SMART BINS: public.bins
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2.5 WASTE SUBMISSIONS: public.waste_submissions
-- ------------------------------------------------------------------------------
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
  assigned_admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2.6 POINTS HISTORY: public.points_history
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.waste_submissions(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'EARNED' CHECK (transaction_type IN ('EARNED', 'REDEEMED', 'BONUS', 'REFUNDED')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2.7 COUPONS / REWARDS: public.coupons
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  coupon_code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(50) NOT NULL DEFAULT 'PERCENTAGE' CHECK (discount_type IN ('PERCENTAGE', 'FIXED', 'FLAT')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  reward_points_required INTEGER NOT NULL DEFAULT 0 CHECK (reward_points_required >= 0),
  maximum_redemptions INTEGER NOT NULL DEFAULT 100 CHECK (maximum_redemptions > 0),
  current_redemptions INTEGER NOT NULL DEFAULT 0 CHECK (current_redemptions >= 0),
  stock INTEGER NOT NULL DEFAULT 100,
  banner_url TEXT,
  image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED', 'EXPIRED', 'SUSPENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT unique_business_coupon_code UNIQUE (business_id, coupon_code)
);

-- ------------------------------------------------------------------------------
-- 2.8 COUPON REDEMPTIONS: public.coupon_redemptions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  voucher_code TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status VARCHAR(50) NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'COMPLETED', 'CANCELLED')),
  verified_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  visit_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  points_used INTEGER NOT NULL DEFAULT 0 CHECK (points_used >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 2.9 STORE VISITS: public.store_visits
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coupon_redemption_id UUID REFERENCES public.coupon_redemptions(id) ON DELETE SET NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  verified_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 2.10 CAMPAIGNS: public.campaigns
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  banner_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 2.11 REWARD TRANSACTIONS: public.reward_transactions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  coupon_redemption_id UUID REFERENCES public.coupon_redemptions(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('EARNED', 'REDEEMED', 'REFUNDED', 'BONUS', 'EXPIRED')),
  points INTEGER NOT NULL CHECK (points <> 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2.12 NOTIFICATIONS: public.notifications
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2.13 SUPPORT TICKETS & MESSAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  assigned_admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2.14 GOVERNANCE & SECURITY: audit_logs, settings, feature_flags
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  action TEXT,
  entity TEXT,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. TRIGGERS & PROCEDURES (RPC)
-- ==============================================================================

-- 3.1 Updated At Timestamp Trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bins_updated_at ON public.bins;
CREATE TRIGGER update_bins_updated_at BEFORE UPDATE ON public.bins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_waste_submissions_updated_at ON public.waste_submissions;
CREATE TRIGGER update_waste_submissions_updated_at BEFORE UPDATE ON public.waste_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.2 Supabase Auth Sync Trigger (Auto User Creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
    'Active',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.3 RPC: Waste Submission Verification (Admin Action)
CREATE OR REPLACE FUNCTION public.verify_waste_submission(
  p_submission_id UUID,
  p_points INTEGER,
  p_admin_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_waste_weight DOUBLE PRECISION;
BEGIN
  -- Get user ID and submission weight
  SELECT user_id, weight INTO v_user_id, v_waste_weight
  FROM public.waste_submissions
  WHERE id = p_submission_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Submission % not found.', p_submission_id;
  END IF;

  -- 1. Update Submission status
  UPDATE public.waste_submissions
  SET status = 'VERIFIED',
      points_awarded = p_points,
      assigned_admin_id = p_admin_id,
      verified_at = NOW()
  WHERE id = p_submission_id;

  -- 2. Award points and waste count to user
  UPDATE public.users
  SET points = points + p_points,
      waste_submitted = waste_submitted + COALESCE(v_waste_weight, 1.0)
  WHERE id = v_user_id;

  -- 3. Record points history
  INSERT INTO public.points_history (user_id, submission_id, points, transaction_type, description)
  VALUES (v_user_id, p_submission_id, p_points, 'EARNED', 'Recycling waste verified');

  -- 4. Send notification to user
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (v_user_id, 'POINTS_EARNED', 'Recycling Verified!', 'Your recycling submission was verified. You earned ' || p_points || ' points!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4 Coupon Redemption Trigger
CREATE OR REPLACE FUNCTION public.handle_coupon_redemption()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.coupons
  SET current_redemptions = current_redemptions + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_coupon_redemption ON public.coupon_redemptions;
CREATE TRIGGER trg_increment_coupon_redemption
  AFTER INSERT ON public.coupon_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_coupon_redemption();

-- ==============================================================================
-- 4. ANALYTICAL VIEWS FOR BUSINESS & ADMIN DASHBOARDS
-- ==============================================================================

CREATE OR REPLACE VIEW public.dashboard_business_insights AS
SELECT 
    b.id AS business_id,
    b.business_name,
    COALESCE(COUNT(DISTINCT cp.id), 0) AS total_coupons_created,
    COALESCE(COUNT(DISTINCT CASE WHEN cp.status = 'ACTIVE' AND cp.expiry_date > CURRENT_TIMESTAMP THEN cp.id END), 0) AS active_coupons,
    COALESCE(COUNT(DISTINCT cr.id), 0) AS total_coupon_redemptions,
    COALESCE(COUNT(DISTINCT cr.customer_id), 0) AS total_customers_reached,
    COALESCE(COUNT(DISTINCT sv.id), 0) AS total_store_visits
FROM public.businesses b
LEFT JOIN public.coupons cp ON b.id = cp.business_id AND cp.deleted_at IS NULL
LEFT JOIN public.coupon_redemptions cr ON b.id = cr.business_id AND cr.deleted_at IS NULL
LEFT JOIN public.store_visits sv ON b.id = sv.business_id AND sv.deleted_at IS NULL
WHERE b.deleted_at IS NULL
GROUP BY b.id, b.business_name;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & STORAGE POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Public read for bins
DROP POLICY IF EXISTS "Anyone can view active bins" ON public.bins;
CREATE POLICY "Anyone can view active bins" ON public.bins FOR SELECT USING (true);

-- User policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own submissions" ON public.waste_submissions;
CREATE POLICY "Users can view own submissions" ON public.waste_submissions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own submissions" ON public.waste_submissions;
CREATE POLICY "Users can insert own submissions" ON public.waste_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Storage Buckets Configuration (waste-images, bin-images, business-assets)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('waste-images', 'waste-images', true),
  ('bin-images', 'bin-images', true),
  ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read waste-images" ON storage.objects;
CREATE POLICY "Public read waste-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'waste-images');

DROP POLICY IF EXISTS "Auth upload waste-images" ON storage.objects;
CREATE POLICY "Auth upload waste-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'waste-images');
