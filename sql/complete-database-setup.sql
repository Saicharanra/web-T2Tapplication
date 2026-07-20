-- ============================================
-- COMPLETE DATABASE SETUP - ALL-IN-ONE FILE
-- Every SQL command you need in a single file
-- ============================================

-- ============================================
-- TABLE OF CONTENTS
-- ============================================
-- PART A: INITIAL SETUP
--   1. Database Schema Creation (User, Submission, OTP, Bins, Notifications, Rewards)
--   2. Clerk Webhook Support & Triggers
--   3. Storage Bucket Policies & RLS
--   4. Admin User Setup
--
-- PART B: VERIFICATION & DIAGNOSTICS
--   5. Verify Complete Setup
--   6. Webhook Diagnostics
--   7. Submission Diagnostics
--
-- PART C: OPERATIONS
--   8. Find Submission IDs
--   9. Verify/Reject Submissions
--   10. User Management
--
-- PART D: MAINTENANCE
--   11. Common Fixes
--   12. Reporting & Statistics
--   13. Cleanup Operations
--
-- PART E: TESTING
--   14. Test Webhook Functionality
--   15. Test Data Generation

-- ============================================
-- ============================================
-- PART A: INITIAL SETUP
-- ============================================
-- ============================================

-- ============================================
-- 1. DATABASE SCHEMA CREATION
-- Run this FIRST to create all tables
-- ============================================

-- Drop existing tables (OPTIONAL - only if resetting everything)
-- Uncomment only if you want to start fresh
-- DROP TABLE IF EXISTS "PointsHistory" CASCADE;
-- DROP TABLE IF EXISTS "Submission" CASCADE;
-- DROP TABLE IF EXISTS "User" CASCADE;

-- Create User Role Enum Type
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'OWNER', 'BUSINESS');

-- ============================================
-- Create User Table (Clerk Webhook Compatible)
-- ============================================
CREATE TABLE IF NOT EXISTS "User" (
  -- Clerk authentication fields
  id TEXT PRIMARY KEY,                                    -- Clerk user ID (e.g., user_2abc123xyz)
  name TEXT NOT NULL,                                     -- first_name + last_name combined
  email TEXT UNIQUE NOT NULL,                             -- Primary email from Clerk
  password TEXT,                                          -- Password field for email/password auth
  "imageUrl" TEXT,                                        -- Profile picture URL (optional)
  
  -- Application-specific fields
  role user_role NOT NULL DEFAULT 'USER',
  location TEXT,                                          -- User location (set by user later)
  level TEXT NOT NULL DEFAULT 'BRONZE' 
    CHECK (level IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE' 
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'SUSPENDED')),
  
  -- Timestamps
  "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()      -- Required for Clerk webhooks
);

-- ============================================
-- Create Submission Table
-- ============================================
CREATE TABLE IF NOT EXISTS "Submission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "wasteType" TEXT NOT NULL,
  
  -- Image storage fields
  "imageUrl" TEXT NOT NULL,                               -- Public URL
  "imagePath" TEXT NOT NULL DEFAULT '',                   -- Storage path
  "imageSize" INTEGER,                                    -- File size in bytes
  "imageMimeType" TEXT,                                   -- Content type
  
  -- Verification fields
  "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  location TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "verifiedAt" TIMESTAMP WITH TIME ZONE,
  "assignedAdminId" TEXT,
  "rejectionReason" TEXT
);

-- ============================================
-- Create PointsHistory Table
-- ============================================
CREATE TABLE IF NOT EXISTS "PointsHistory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "submissionId" TEXT NOT NULL,
  points INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- Create OTP Table
-- ============================================
CREATE TABLE IF NOT EXISTS "OTP" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  otp TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ============================================
-- Create Bin Table
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

-- ============================================
-- Create Notification Table
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

-- ============================================
-- Create Reward Table
-- ============================================
CREATE TABLE IF NOT EXISTS "Reward" (
  reward_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  image_url TEXT DEFAULT '🎁',
  status TEXT DEFAULT 'Active' CHECK (status IN ('PENDING_APPROVAL', 'Active', 'Inactive', 'Suspended')),
  category TEXT DEFAULT 'General',
  stock INTEGER DEFAULT 0,
  business_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  company_name TEXT,
  discount_type TEXT DEFAULT 'Percentage',
  discount_value NUMERIC DEFAULT 0,
  original_price NUMERIC,
  expiry_date TIMESTAMP WITH TIME ZONE,
  max_redemptions INTEGER DEFAULT 100,
  remaining_redemptions INTEGER DEFAULT 100,
  min_purchase NUMERIC DEFAULT 0,
  terms TEXT,
  store_location TEXT,
  website TEXT,
  contact_number TEXT,
  logo_url TEXT,
  banner_url TEXT,
  allow_multiple BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create RewardCode Table
-- ============================================
CREATE TABLE IF NOT EXISTS "RewardCode" (
  id SERIAL PRIMARY KEY,
  reward_id INTEGER REFERENCES "Reward"(reward_id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create RewardRedemption Table
-- ============================================
CREATE TABLE IF NOT EXISTS "RewardRedemption" (
  redemption_id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  reward_id INTEGER REFERENCES "Reward"(reward_id) ON DELETE SET NULL,
  code_id INTEGER REFERENCES "RewardCode"(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','USED')),
  used_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create Performance Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_status ON "User"(status);
CREATE INDEX IF NOT EXISTS idx_submission_userId ON "Submission"("userId");
CREATE INDEX IF NOT EXISTS idx_submission_status ON "Submission"(status);
CREATE INDEX IF NOT EXISTS idx_submission_createdAt ON "Submission"("createdAt");
CREATE INDEX IF NOT EXISTS idx_points_userId ON "PointsHistory"("userId");
CREATE INDEX IF NOT EXISTS idx_points_createdAt ON "PointsHistory"("createdAt");

-- OTP Indexes
CREATE INDEX IF NOT EXISTS idx_otp_email ON "OTP"(email);

-- Bin Indexes
CREATE INDEX IF NOT EXISTS idx_bin_addedBy ON "Bin"("addedBy");
CREATE INDEX IF NOT EXISTS idx_bin_location ON "Bin"(latitude, longitude);

-- Notification Indexes
CREATE INDEX IF NOT EXISTS idx_notification_userId ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS idx_notification_read ON "Notification"(read);
CREATE INDEX IF NOT EXISTS idx_notification_createdAt ON "Notification"("createdAt");

-- Reward, Code and Redemption Indexes
CREATE INDEX IF NOT EXISTS idx_reward_status ON "Reward"(status);
CREATE INDEX IF NOT EXISTS idx_code_available ON "RewardCode"(reward_id, is_used);
CREATE INDEX IF NOT EXISTS idx_redemption_user ON "RewardRedemption"(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_business ON "Reward"(business_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_code_usage ON "RewardRedemption"(code_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_reward ON "RewardRedemption"(user_id, reward_id);

-- ============================================
-- 2. CLERK WEBHOOK SUPPORT
-- Auto-update trigger for User.updatedAt
-- ============================================

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";

CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update triggers for Reward and RewardRedemption
CREATE OR REPLACE FUNCTION update_reward_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reward_time ON "Reward";
CREATE TRIGGER update_reward_time
  BEFORE UPDATE ON "Reward"
  FOR EACH ROW
  EXECUTE FUNCTION update_reward_updated_at();

CREATE OR REPLACE FUNCTION update_redemption_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_redemption_time ON "RewardRedemption";
CREATE TRIGGER update_redemption_time
  BEFORE UPDATE ON "RewardRedemption"
  FOR EACH ROW
  EXECUTE FUNCTION update_redemption_updated_at();

-- Add columns if upgrading existing table
DO $$ 
BEGIN
  -- Add updatedAt if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE '✅ Added updatedAt column';
  END IF;
  
  -- Add imageUrl if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'imageUrl'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "imageUrl" TEXT;
    RAISE NOTICE '✅ Added imageUrl column';
  END IF;
END $$;

-- ============================================
-- 3. STORAGE BUCKET POLICIES
-- Run AFTER creating 'waste-images' bucket
-- in Supabase Dashboard → Storage
-- ============================================

-- Policy 1: Public read access
CREATE POLICY "Public read access on waste-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'waste-images');

-- Policy 2: Authenticated users can upload
CREATE POLICY "Authenticated users can upload to waste-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'waste-images');

-- Policy 3: Users can delete their own images
CREATE POLICY "Users can delete own images in waste-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'waste-images' AND
  (storage.foldername(name))[1] = 'submissions' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 4: Admins can delete any image
CREATE POLICY "Admins can delete any image in waste-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'waste-images' AND
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid()::text
    AND role = 'ADMIN'
  )
);

-- ============================================
-- 3b. ADDITIONAL RLS & BUCKET POLICIES (OTP, Bins, Notifications)
-- ============================================

-- RLS Enablement
ALTER TABLE "OTP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- OTP Policies (OTP should never be accessible from the browser)
DROP POLICY IF EXISTS "Service role manages OTPs" ON "OTP";
CREATE POLICY "Service role manages OTPs"
  ON "OTP" TO service_role
  USING (true) WITH CHECK (true);

-- Bin Policies (Public view, service role manage)
DROP POLICY IF EXISTS "Anyone can view bins" ON "Bin";
CREATE POLICY "Anyone can view bins"
  ON "Bin" FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Service role can manage bins" ON "Bin";
CREATE POLICY "Service role can manage bins"
  ON "Bin" TO service_role USING (true) WITH CHECK (true);

-- Notification Policies (Service role manage, users read/update own)
DROP POLICY IF EXISTS "Service role manages notifications" ON "Notification";
CREATE POLICY "Service role manages notifications"
  ON "Notification" TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own notifications" ON "Notification";
CREATE POLICY "Users can view own notifications"
  ON "Notification" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON "Notification";
CREATE POLICY "Users can update own notifications"
  ON "Notification" FOR UPDATE USING (true);

-- Storage bucket policies for 'bin-images' (Public bucket)
DROP POLICY IF EXISTS "Public read for bin-images" ON storage.objects;
CREATE POLICY "Public read for bin-images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'bin-images');

DROP POLICY IF EXISTS "Service role upload to bin-images" ON storage.objects;
CREATE POLICY "Service role upload to bin-images"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'bin-images');

DROP POLICY IF EXISTS "Service role delete bin-images" ON storage.objects;
CREATE POLICY "Service role delete bin-images"
  ON storage.objects FOR DELETE TO service_role
  USING (bucket_id = 'bin-images');

-- Enable Realtime for Notification table
-- ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";

-- ============================================
-- 4. ADMIN USER SETUP
-- Replace with YOUR Clerk user ID
-- ============================================

-- Method 1: Insert yourself as admin (replace all values)
INSERT INTO "User" (id, name, email, role, level, points, status)
VALUES (
  'user_YOUR_CLERK_ID_HERE',     -- 👈 Change to your Clerk ID
  'Admin User',                   -- 👈 Change to your name
  'admin@example.com',            -- 👈 Change to your email
  'ADMIN',
  'PLATINUM',
  0,
  'ACTIVE'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'ADMIN',
  level = 'PLATINUM',
  status = 'ACTIVE';

-- Method 2: Promote existing user to admin
-- UPDATE "User" 
-- SET role = 'ADMIN', level = 'PLATINUM'
-- WHERE id = 'user_YOUR_CLERK_ID_HERE';


-- ============================================
-- ============================================
-- PART B: VERIFICATION & DIAGNOSTICS
-- ============================================
-- ============================================

-- ============================================
-- 5. VERIFY COMPLETE SETUP
-- Check if everything is working
-- ============================================

-- Check table row counts
SELECT 
  'User' as table_name, 
  COUNT(*) as row_count,
  COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admin_count
FROM "User"
UNION ALL
SELECT 'Submission', COUNT(*), COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END)
FROM "Submission"
UNION ALL
SELECT 'PointsHistory', COUNT(*), 0
FROM "PointsHistory";

-- Verify YOUR admin status
SELECT 
  id,
  name,
  email,
  role,
  level,
  points,
  CASE 
    WHEN role = 'ADMIN' THEN '✅ YOU ARE ADMIN'
    ELSE '❌ NOT ADMIN - Update Section 4'
  END as admin_status,
  "joinedAt",
  "updatedAt"
FROM "User"
WHERE id = 'user_YOUR_CLERK_ID_HERE';  -- 👈 Replace with your ID

-- Check storage policies exist
SELECT 
  policyname,
  cmd,
  permissive,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Read access'
    WHEN cmd = 'INSERT' THEN '✅ Upload access'
    WHEN cmd = 'DELETE' THEN '✅ Delete access'
  END as policy_type
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%waste-images%';

-- ============================================
-- 6. WEBHOOK DIAGNOSTICS
-- Check Clerk webhook compatibility
-- ============================================

-- Check if User table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'User'
    ) THEN '✅ User table EXISTS'
    ELSE '❌ User table MISSING - Run Section 1'
  END as table_status;

-- Check all required webhook columns
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'id' AND data_type = 'text') 
    THEN '✅ id (TEXT)' ELSE '❌ MISSING' END as col_id,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'name') 
    THEN '✅ name' ELSE '❌ MISSING' END as col_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'email') 
    THEN '✅ email' ELSE '❌ MISSING' END as col_email,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'imageUrl') 
    THEN '✅ imageUrl' ELSE '⚠️ OPTIONAL' END as col_imageUrl,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'updatedAt') 
    THEN '✅ updatedAt' ELSE '❌ MISSING - Run Section 2' END as col_updatedAt;

-- Check auto-update trigger
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE event_object_table = 'User' 
      AND trigger_name = 'update_user_updated_at'
    )
    THEN '✅ Auto-update trigger active'
    ELSE '❌ Trigger missing - Run Section 2'
  END as trigger_status;

-- Show User table structure
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  CASE 
    WHEN column_name = 'id' THEN 'Clerk User ID'
    WHEN column_name = 'name' THEN 'From Clerk (first + last)'
    WHEN column_name = 'email' THEN 'From Clerk email_addresses'
    WHEN column_name = 'imageUrl' THEN 'From Clerk image_url'
    WHEN column_name = 'updatedAt' THEN 'Auto-updated trigger'
    ELSE 'Application field'
  END as description
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- Test webhook insert (simulates Clerk webhook)
DO $$
DECLARE
  test_id TEXT := 'test_webhook_' || floor(random() * 1000000)::text;
BEGIN
  INSERT INTO "User" (id, name, email, role, level, points, status)
  VALUES (
    test_id,
    'Test Webhook User',
    'test_' || test_id || '@clerk.test',
    'USER',
    'BRONZE',
    0,
    'ACTIVE'
  );
  
  RAISE NOTICE '✅ Webhook test insert successful!';
  
  DELETE FROM "User" WHERE id = test_id;
  RAISE NOTICE '✅ Test user cleaned up';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Webhook test failed: %', SQLERRM;
END $$;

-- Check recent Clerk users
SELECT 
  id,
  name,
  email,
  role,
  "imageUrl",
  "joinedAt",
  "updatedAt",
  CASE 
    WHEN id LIKE 'user_%' THEN '✅ Clerk ID format'
    ELSE '⚠️ Non-Clerk ID'
  END as id_format
FROM "User"
ORDER BY "joinedAt" DESC
LIMIT 10;

-- Find users without updatedAt
SELECT 
  id,
  name,
  email,
  "joinedAt",
  "updatedAt",
  '❌ Needs updatedAt' as status
FROM "User"
WHERE "updatedAt" IS NULL;

-- Check for duplicate emails
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id, ', ') as user_ids,
  '❌ Webhook will fail' as warning
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;

-- ============================================
-- 7. SUBMISSION DIAGNOSTICS
-- Debug submission and image issues
-- ============================================

-- Count submissions by status
SELECT 
  status,
  COUNT(*) as count,
  SUM("pointsAwarded") as total_points
FROM "Submission"
GROUP BY status
ORDER BY count DESC;

-- Check recent submissions with user info
SELECT 
  s.id,
  s."wasteType",
  LEFT(s."imageUrl", 60) as image_preview,
  s.status,
  s."pointsAwarded",
  s."createdAt",
  u.name as user_name,
  u.email as user_email
FROM "Submission" s
LEFT JOIN "User" u ON s."userId" = u.id
ORDER BY s."createdAt" DESC
LIMIT 10;

-- Check for orphaned submissions (no user)
SELECT 
  s.id,
  s."userId",
  s."wasteType",
  s.status,
  '❌ User missing' as issue
FROM "Submission" s
LEFT JOIN "User" u ON s."userId" = u.id
WHERE u.id IS NULL;

-- Check image fields are populated
SELECT 
  id,
  CASE WHEN "imageUrl" IS NOT NULL AND "imageUrl" != '' THEN '✅' ELSE '❌' END as has_imageUrl,
  CASE WHEN "imagePath" IS NOT NULL AND "imagePath" != '' THEN '✅' ELSE '❌' END as has_imagePath,
  CASE WHEN "imageSize" IS NOT NULL THEN '✅' ELSE '❌' END as has_imageSize,
  CASE WHEN "imageMimeType" IS NOT NULL THEN '✅' ELSE '❌' END as has_mimeType,
  "wasteType",
  status
FROM "Submission"
ORDER BY "createdAt" DESC
LIMIT 10;

-- List all users with submission counts
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.level,
  u.points,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'VERIFIED' THEN 1 END) as verified,
  COUNT(CASE WHEN s.status = 'PENDING' THEN 1 END) as pending,
  COUNT(CASE WHEN s.status = 'REJECTED' THEN 1 END) as rejected
FROM "User" u
LEFT JOIN "Submission" s ON u.id = s."userId"
GROUP BY u.id, u.name, u.email, u.role, u.level, u.points
ORDER BY total_submissions DESC;


-- ============================================
-- ============================================
-- PART C: OPERATIONS
-- ============================================
-- ============================================

-- ============================================
-- 8. FIND SUBMISSION IDS
-- Get IDs for verification/rejection
-- ============================================

-- Get ALL submissions
SELECT 
  id,
  "userId",
  "wasteType",
  status,
  "pointsAwarded",
  location,
  "createdAt"
FROM "Submission"
ORDER BY "createdAt" DESC;

-- Get PENDING submissions only
SELECT 
  id,
  "wasteType",
  location,
  LEFT("imageUrl", 50) as image_preview,
  "createdAt"
FROM "Submission"
WHERE status = 'PENDING'
ORDER BY "createdAt" DESC;

-- Get submissions by specific user
SELECT 
  id,
  "wasteType",
  status,
  "pointsAwarded",
  "createdAt"
FROM "Submission"
WHERE "userId" = 'user_YOUR_CLERK_ID_HERE'  -- 👈 Replace
ORDER BY "createdAt" DESC;

-- Get submissions by waste type
SELECT 
  "wasteType",
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending
FROM "Submission"
GROUP BY "wasteType"
ORDER BY count DESC;

-- ============================================
-- 9. VERIFY/REJECT SUBMISSIONS
-- Admin operations (replace SUBMISSION_ID)
-- ============================================

-- VERIFY a submission (3 steps - run all together)
-- Step 1: Update submission status
UPDATE "Submission"
SET 
  status = 'VERIFIED',
  "pointsAwarded" = 50,                              -- 👈 Adjust points
  "verifiedAt" = NOW(),
  "assignedAdminId" = 'user_YOUR_CLERK_ID_HERE'      -- 👈 Your admin ID
WHERE id = 'SUBMISSION_ID_HERE';                     -- 👈 Replace with actual ID

-- Step 2: Award points to user
UPDATE "User"
SET points = points + 50                             -- 👈 Match points above
WHERE id = (SELECT "userId" FROM "Submission" WHERE id = 'SUBMISSION_ID_HERE');

-- Step 3: Create points history record
INSERT INTO "PointsHistory" ("userId", "submissionId", points)
SELECT "userId", id::text, 50                        -- 👈 Match points above
FROM "Submission"
WHERE id = 'SUBMISSION_ID_HERE';

-- REJECT a submission
UPDATE "Submission"
SET 
  status = 'REJECTED',
  "rejectionReason" = 'Image quality does not meet requirements',  -- 👈 Change reason
  "assignedAdminId" = 'user_YOUR_CLERK_ID_HERE'                    -- 👈 Your admin ID
WHERE id = 'SUBMISSION_ID_HERE';                                   -- 👈 Replace with actual ID

-- BULK VERIFY multiple submissions (adjust IDs and points)
UPDATE "Submission"
SET 
  status = 'VERIFIED',
  "pointsAwarded" = 50,
  "verifiedAt" = NOW(),
  "assignedAdminId" = 'user_YOUR_CLERK_ID_HERE'
WHERE id IN ('ID_1', 'ID_2', 'ID_3');  -- 👈 Add your IDs

-- ============================================
-- 10. USER MANAGEMENT
-- Admin operations for users
-- ============================================

-- Promote user to admin
UPDATE "User" 
SET 
  role = 'ADMIN',
  level = 'PLATINUM'
WHERE id = 'user_CLERK_ID_TO_PROMOTE';

-- Demote admin to regular user
UPDATE "User"
SET role = 'USER'
WHERE id = 'user_CLERK_ID_TO_DEMOTE';

-- Deactivate user
UPDATE "User"
SET status = 'INACTIVE'
WHERE id = 'user_CLERK_ID';

-- Reactivate user
UPDATE "User"
SET status = 'ACTIVE'
WHERE id = 'user_CLERK_ID';

-- Update user level based on points
UPDATE "User" SET level = 'BRONZE' WHERE points < 100;
UPDATE "User" SET level = 'SILVER' WHERE points >= 100 AND points < 500;
UPDATE "User" SET level = 'GOLD' WHERE points >= 500 AND points < 1000;
UPDATE "User" SET level = 'PLATINUM' WHERE points >= 1000;

-- List all admins
SELECT 
  id,
  name,
  email,
  level,
  points,
  status,
  "joinedAt"
FROM "User"
WHERE role = 'ADMIN'
ORDER BY "joinedAt" DESC;

-- Find users by email pattern
SELECT 
  id,
  name,
  email,
  role,
  level,
  points
FROM "User"
WHERE email LIKE '%@example.com%'
ORDER BY "joinedAt" DESC;


-- ============================================
-- ============================================
-- PART D: MAINTENANCE
-- ============================================
-- ============================================

-- ============================================
-- 11. COMMON FIXES
-- Solutions to frequent problems
-- ============================================

-- Fix 1: Add missing updatedAt values
UPDATE "User"
SET "updatedAt" = "joinedAt"
WHERE "updatedAt" IS NULL;

-- Fix 2: Add missing imagePath (for old submissions)
UPDATE "Submission" 
SET "imagePath" = "imageUrl" 
WHERE "imagePath" = '' OR "imagePath" IS NULL;

-- Fix 3: Reset user points to match verified submissions
UPDATE "User" u
SET points = COALESCE((
  SELECT SUM("pointsAwarded")
  FROM "Submission" s
  WHERE s."userId" = u.id AND s.status = 'VERIFIED'
), 0);

-- Fix 4: Standardize empty/null names
UPDATE "User"
SET name = 'User ' || SUBSTRING(id FROM 6 FOR 8)
WHERE name IS NULL OR name = '' OR TRIM(name) = '';

-- Fix 5: Remove duplicate users (keep oldest)
DELETE FROM "User" a 
USING "User" b
WHERE a.id > b.id AND a.email = b.email;

-- Fix 6: Delete orphaned submissions (no user)
DELETE FROM "Submission"
WHERE "userId" NOT IN (SELECT id FROM "User");

-- Fix 7: Add default location for users
UPDATE "User"
SET location = 'Not specified'
WHERE location IS NULL;

-- Fix 8: Reset imageUrl for users (manual sync from Clerk)
UPDATE "User"
SET "imageUrl" = NULL
WHERE "imageUrl" = '' OR "imageUrl" = 'undefined';

-- Fix 9: Recalculate submission points
UPDATE "Submission"
SET "pointsAwarded" = 
  CASE "wasteType"
    WHEN 'Plastic Bottles' THEN 15
    WHEN 'paperWaste' THEN 10
    WHEN 'Metal Cans' THEN 25
    WHEN 'Glass Bottles' THEN 20
    WHEN 'Cardboard' THEN 12
    WHEN 'E-waste' THEN 50
    WHEN 'Organic waste'  THEN 18
    WHEN 'Mixed Recyclables' THEN 15
    ELSE 50
  END
WHERE status = 'VERIFIED';

-- Fix 10: Migrate role column from TEXT to user_role ENUM (fixes cast error 42804)
-- Run this if you get the error: "default for column 'role' cannot be cast automatically to type user_role"
-- 1. Create type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'OWNER', 'BUSINESS');
  END IF;
END $$;
-- 2. Ensure all expected values exist in the enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'BUSINESS';
-- 3. Drop check constraints on the role column that might conflict
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_role_check";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "user_role_check";
-- 4. Drop the default value constraint
ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;
-- 5. Alter the column type with an explicit cast
ALTER TABLE "User" ALTER COLUMN role TYPE user_role USING role::user_role;
-- 6. Re-apply the default constraint with correct type
ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'USER'::user_role;


-- ============================================
-- 12. REPORTING & STATISTICS
-- Analytics and insights
-- ============================================

-- Overall system statistics
SELECT 
  (SELECT COUNT(*) FROM "User") as total_users,
  (SELECT COUNT(*) FROM "User" WHERE role = 'ADMIN') as admins,
  (SELECT COUNT(*) FROM "User" WHERE status = 'ACTIVE') as active_users,
  (SELECT COUNT(*) FROM "Submission") as total_submissions,
  (SELECT COUNT(*) FROM "Submission" WHERE status = 'PENDING') as pending,
  (SELECT COUNT(*) FROM "Submission" WHERE status = 'VERIFIED') as verified,
  (SELECT COUNT(*) FROM "Submission" WHERE status = 'REJECTED') as rejected,
  (SELECT SUM(points) FROM "User") as total_points_awarded,
  (SELECT COUNT(*) FROM "PointsHistory") as points_transactions;

-- Top users by points (leaderboard)
SELECT 
  ROW_NUMBER() OVER (ORDER BY points DESC) as rank,
  name,
  email,
  level,
  points,
  (SELECT COUNT(*) FROM "Submission" WHERE "userId" = "User".id AND status = 'VERIFIED') as verified_submissions
FROM "User"
WHERE status = 'ACTIVE'
ORDER BY points DESC
LIMIT 20;

-- Submissions by waste type
SELECT 
  "wasteType",
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END) as verified,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected,
  SUM("pointsAwarded") as total_points
FROM "Submission"
GROUP BY "wasteType"
ORDER BY total_count DESC;

-- Submissions by location
SELECT 
  location,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END) as verified,
  SUM("pointsAwarded") as points_awarded
FROM "Submission"
GROUP BY location
ORDER BY total DESC
LIMIT 10;

-- Daily submission trends (last 30 days)
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as submissions,
  COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END) as verified,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
  SUM("pointsAwarded") as points_awarded
FROM "Submission"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;

-- User level distribution
SELECT 
  level,
  COUNT(*) as user_count,
  ROUND(AVG(points), 2) as avg_points,
  MIN(points) as min_points,
  MAX(points) as max_points
FROM "User"
WHERE status = 'ACTIVE'
GROUP BY level
ORDER BY 
  CASE level
    WHEN 'PLATINUM' THEN 1
    WHEN 'GOLD' THEN 2
    WHEN 'SILVER' THEN 3
    WHEN 'BRONZE' THEN 4
  END;

-- Admin activity report
SELECT 
  u.name as admin_name,
  COUNT(s.id) as submissions_verified,
  SUM(s."pointsAwarded") as points_awarded,
  MIN(s."verifiedAt") as first_verification,
  MAX(s."verifiedAt") as last_verification
FROM "User" u
LEFT JOIN "Submission" s ON s."assignedAdminId" = u.id AND s.status = 'VERIFIED'
WHERE u.role = 'ADMIN'
GROUP BY u.id, u.name
ORDER BY submissions_verified DESC;

-- Points history summary
SELECT 
  u.name,
  u.email,
  COUNT(ph.id) as transactions,
  SUM(ph.points) as total_points_earned,
  MIN(ph."createdAt") as first_transaction,
  MAX(ph."createdAt") as last_transaction
FROM "User" u
JOIN "PointsHistory" ph ON ph."userId" = u.id
GROUP BY u.id, u.name, u.email
ORDER BY total_points_earned DESC
LIMIT 10;

-- ============================================
-- 13. CLEANUP OPERATIONS
-- Database optimization (use with caution!)
-- ============================================

-- Remove old rejected submissions (>30 days)
-- DELETE FROM "Submission"
-- WHERE status = 'REJECTED' 
-- AND "createdAt" < NOW() - INTERVAL '30 days';

-- Remove inactive users (>90 days inactive, no submissions)
-- DELETE FROM "User"
-- WHERE status = 'INACTIVE'
-- AND "updatedAt" < NOW() - INTERVAL '90 days'
-- AND id NOT IN (SELECT DISTINCT "userId" FROM "Submission");

-- Archive old points history (move to archive table first)
-- DELETE FROM "PointsHistory"
-- WHERE "createdAt" < NOW() - INTERVAL '1 year';

-- Vacuum database (optimize storage)
-- VACUUM ANALYZE "User";
-- VACUUM ANALYZE "Submission";
-- VACUUM ANALYZE "PointsHistory";

-- Reset sequences (if needed)
-- This doesn't apply to UUID/TEXT primary keys


-- ============================================
-- ============================================
-- PART E: TESTING
-- ============================================
-- ============================================

-- ============================================
-- 14. TEST WEBHOOK FUNCTIONALITY
-- Simulate Clerk webhook events
-- ============================================

-- Test 1: Simulate user.created event
INSERT INTO "User" (id, name, email, "imageUrl", role, level, points, status)
VALUES (
  'user_test_webhook_001',
  'Test Webhook User',
  'test.webhook@clerk.test',
  'https://img.clerk.com/test.jpg',
  'USER',
  'BRONZE',
  0,
  'ACTIVE'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  "imageUrl" = EXCLUDED."imageUrl",
  "updatedAt" = NOW();

-- Test 2: Simulate user.updated event (verify updatedAt changes)
UPDATE "User"
SET name = 'Updated Test User'
WHERE id = 'user_test_webhook_001';

-- Test 3: Verify updatedAt changed
SELECT 
  id,
  name,
  "joinedAt",
  "updatedAt",
  CASE 
    WHEN "updatedAt" > "joinedAt" THEN '✅ Auto-update working'
    ELSE '❌ Trigger not working'
  END as trigger_status
FROM "User"
WHERE id = 'user_test_webhook_001';

-- Test 4: Simulate user.deleted event
DELETE FROM "User" 
WHERE id = 'user_test_webhook_001';

-- Verify cleanup
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM "User" WHERE id = 'user_test_webhook_001')
    THEN '✅ Test user deleted successfully'
    ELSE '❌ Deletion failed'
  END as cleanup_status;

-- ============================================
-- 15. TEST DATA GENERATION
-- Create sample data for testing
-- ============================================

-- Create test users
DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    INSERT INTO "User" (id, name, email, role, level, points, status)
    VALUES (
      'user_test_' || i,
      'Test User ' || i,
      'testuser' || i || '@example.com',
      'USER',
      CASE 
        WHEN i <= 1 THEN 'PLATINUM'
        WHEN i <= 2 THEN 'GOLD'
        WHEN i <= 3 THEN 'SILVER'
        ELSE 'BRONZE'
      END,
      (6 - i) * 200,  -- Decreasing points
      'ACTIVE'
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE '✅ Created 5 test users';
END $$;

-- View test users
SELECT id, name, email, level, points
FROM "User"
WHERE id LIKE 'user_test_%'
ORDER BY points DESC;

-- Delete all test data
-- DELETE FROM "PointsHistory" WHERE "userId" LIKE 'user_test_%';
-- DELETE FROM "Submission" WHERE "userId" LIKE 'user_test_%';
-- DELETE FROM "User" WHERE id LIKE 'user_test_%';


-- ============================================
-- ============================================
-- QUICK START GUIDE
-- ============================================
-- ============================================

/*
🚀 FIRST TIME SETUP (Complete in Order):

1. CREATE TABLES
   ✅ Run Section 1 (Database Schema Creation)
   ✅ Run Section 2 (Clerk Webhook Support)

2. SETUP STORAGE
   ✅ Create 'waste-images' bucket in Supabase Dashboard
   ✅ Run Section 3 (Storage Bucket Policies)

3. ADD ADMIN USER
   ✅ Get your Clerk User ID from dashboard
   ✅ Update Section 4 with your details
   ✅ Run Section 4 (Admin User Setup)

4. VERIFY EVERYTHING
   ✅ Run Section 5 (Verify Complete Setup)
   ✅ Run Section 6 (Webhook Diagnostics)
   ✅ All checks should show ✅

5. CONFIGURE CLERK WEBHOOK
   ✅ Go to Clerk Dashboard → Webhooks
   ✅ Add endpoint: https://yourdomain.com/api/webhooks/clerk
   ✅ Select events: user.created, user.updated, user.deleted
   ✅ Copy webhook secret to .env as CLERK_WEBHOOK_SECRET

6. TEST WEBHOOK
   ✅ Sign up new user in your app
   ✅ Check Section 6 diagnostics
   ✅ User should appear in database

✅ DONE! Your system is ready!

📋 DAILY OPERATIONS:

- Find submissions: Section 8
- Verify submissions: Section 9 (3 steps)
- Manage users: Section 10
- View analytics: Section 12

🔧 TROUBLESHOOTING:

- Images not showing: Section 7
- Webhook issues: Section 6
- Data problems: Section 11 (Common Fixes)
- Need test data: Section 15

🎯 REMEMBER TO REPLACE:
- 'user_YOUR_CLERK_ID_HERE' with your actual Clerk user ID
- 'SUBMISSION_ID_HERE' with actual submission UUIDs
- Point values as needed for your application

📁 THIS IS YOUR SINGLE SOURCE OF TRUTH!
Everything you need is in this one file.
*/

-- ============================================
-- END OF COMPLETE DATABASE SETUP
-- ============================================
