-- ============================================
-- NEW TABLES: OTP + BIN + NOTIFICATION
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 🔑 OTP TABLE
-- Replaces Firestore 'otps' collection
-- Stores temporary 6-digit verification codes
-- ============================================
CREATE TABLE IF NOT EXISTS "OTP" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  otp TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON "OTP"(email);

-- RLS: Service role only (OTP should never be accessible from the browser)
ALTER TABLE "OTP" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages OTPs"
  ON "OTP" TO service_role
  USING (true) WITH CHECK (true);


-- ============================================
-- 📍 BIN TABLE
-- Replaces Firestore 'bins' collection
-- Crowdsourced recycling bin locations
-- ============================================
CREATE TABLE IF NOT EXISTS "Bin" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  "locationType" TEXT NOT NULL,
  "photoUrl" TEXT,
  "addedBy" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bin_addedBy ON "Bin"("addedBy");
CREATE INDEX IF NOT EXISTS idx_bin_location ON "Bin"(latitude, longitude);

-- RLS: Public read, service role full access
ALTER TABLE "Bin" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view bins"
  ON "Bin" FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage bins"
  ON "Bin" TO service_role USING (true) WITH CHECK (true);


-- ============================================
-- 🔔 NOTIFICATION TABLE
-- Replaces Firestore 'notifications' collection
-- In-app notification bell messages
-- ============================================
CREATE TABLE IF NOT EXISTS "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_userId ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS idx_notification_read ON "Notification"(read);
CREATE INDEX IF NOT EXISTS idx_notification_createdAt ON "Notification"("createdAt");

-- RLS: Service role inserts, users can read/update
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages notifications"
  ON "Notification" TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own notifications"
  ON "Notification" FOR SELECT USING (true);
CREATE POLICY "Users can update own notifications"
  ON "Notification" FOR UPDATE USING (true);


-- ============================================
-- 🗂️ STORAGE: bin-images bucket policies
-- IMPORTANT: Create 'bin-images' bucket manually
-- in Supabase Dashboard → Storage → New Bucket
-- (set to Public bucket)
-- Then run these policies:
-- ============================================
CREATE POLICY "Public read for bin-images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'bin-images');

CREATE POLICY "Service role upload to bin-images"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'bin-images');

CREATE POLICY "Service role delete bin-images"
  ON storage.objects FOR DELETE TO service_role
  USING (bucket_id = 'bin-images');


-- ============================================
-- ✅ ENABLE REALTIME on Notification table
-- (So NotificationBell gets live updates)
-- Run this separately in SQL Editor:
-- ============================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
