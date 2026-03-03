-- ============================================
-- TRASH2TREASURE - MASTER SQL FILE
-- Everything you need in one place
-- User ID: user_34H1mCWspyCEKACIsL8KdVnt30D
-- ============================================

-- ============================================
-- TABLE OF CONTENTS
-- ============================================
-- 1. INITIAL DATABASE SETUP
-- 2. ADD YOURSELF AS ADMIN
-- 3. STORAGE BUCKET POLICIES
-- 4. VERIFY SETUP
-- 5. DIAGNOSTICS & TROUBLESHOOTING
-- 6. FIND SUBMISSION IDS
-- 7. VERIFY/REJECT SUBMISSIONS
-- 8. COMMON FIXES
-- 9. REPORTING & STATISTICS
-- 10. CLEANUP OPERATIONS

-- ============================================
-- 1. INITIAL DATABASE SETUP
-- Run this FIRST if tables don't exist
-- ============================================

-- Drop existing tables (OPTIONAL - only if resetting everything)
-- Uncomment only if you want to start fresh
-- DROP TABLE IF EXISTS "PointsHistory" CASCADE;
-- DROP TABLE IF EXISTS "Submission" CASCADE;
-- DROP TABLE IF EXISTS "User" CASCADE;

-- Create User Table (Clerk Webhook Compatible)
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  location TEXT,
  level TEXT NOT NULL DEFAULT 'BRONZE' CHECK (level IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Submission Table with Image Metadata
CREATE TABLE IF NOT EXISTS "Submission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "wasteType" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "imagePath" TEXT NOT NULL DEFAULT '',
  "imageSize" INTEGER,
  "imageMimeType" TEXT,
  "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  location TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "verifiedAt" TIMESTAMP WITH TIME ZONE,
  "assignedAdminId" TEXT,
  "rejectionReason" TEXT
);

-- Create PointsHistory Table
CREATE TABLE IF NOT EXISTS "PointsHistory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "submissionId" TEXT NOT NULL,
  points INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_submission_userId ON "Submission"("userId");
CREATE INDEX IF NOT EXISTS idx_submission_status ON "Submission"(status);
CREATE INDEX IF NOT EXISTS idx_submission_createdAt ON "Submission"("createdAt");
CREATE INDEX IF NOT EXISTS idx_points_userId ON "PointsHistory"("userId");
CREATE INDEX IF NOT EXISTS idx_points_createdAt ON "PointsHistory"("createdAt");

-- Auto-update trigger for User.updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 2. ADD YOURSELF AS ADMIN
-- Run this to give yourself admin access
-- ============================================

INSERT INTO "User" (id, name, email, role, level, points, status)
VALUES (
  'user_34H1mCWspyCEKACIsL8KdVnt30D',
  'Admin User',          -- 👈 Change to your name
  'admin@example.com',   -- 👈 Change to your email
  'ADMIN',
  'PLATINUM',
  0,
  'ACTIVE'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'ADMIN',
  level = 'PLATINUM',
  status = 'ACTIVE';


-- ============================================
-- 3. STORAGE BUCKET POLICIES (RLS)
-- Run these AFTER creating 'waste-images' bucket
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
-- 4. VERIFY SETUP
-- Check if everything is working
-- ============================================

-- Check if tables exist and have data
SELECT 
  'User' as table_name, COUNT(*) as row_count 
FROM "User"
UNION ALL
SELECT 'Submission', COUNT(*) FROM "Submission"
UNION ALL
SELECT 'PointsHistory', COUNT(*) FROM "PointsHistory";

-- Verify YOU are admin
SELECT 
  id,
  name,
  email,
  role,
  level,
  points,
  CASE 
    WHEN role = 'ADMIN' THEN '✅ YOU ARE ADMIN'
    ELSE '❌ NOT ADMIN - Run section 2'
  END as status
FROM "User"
WHERE id = 'user_34H1mCWspyCEKACIsL8KdVnt30D';

-- Check storage policies
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%waste-images%';


-- ============================================
-- 5. DIAGNOSTICS & TROUBLESHOOTING
-- Run these to find problems
-- ============================================

-- Count submissions by status
SELECT 
  status,
  COUNT(*) as count
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
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned submissions'
    ELSE '❌ Found submissions without users'
  END as status
FROM "Submission" s
LEFT JOIN "User" u ON s."userId" = u.id
WHERE u.id IS NULL;

-- Check if image fields are populated
SELECT 
  id,
  CASE WHEN "imageUrl" IS NOT NULL AND "imageUrl" != '' THEN '✅' ELSE '❌' END as has_imageUrl,
  CASE WHEN "imagePath" IS NOT NULL AND "imagePath" != '' THEN '✅' ELSE '❌' END as has_imagePath,
  CASE WHEN "imageSize" IS NOT NULL THEN '✅' ELSE '❌' END as has_imageSize,
  "wasteType",
  status
FROM "Submission"
ORDER BY "createdAt" DESC
LIMIT 5;

-- List all users with submission count
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.level,
  u.points,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'VERIFIED' THEN 1 END) as verified,
  COUNT(CASE WHEN s.status = 'PENDING' THEN 1 END) as pending
FROM "User" u
LEFT JOIN "Submission" s ON u.id = s."userId"
GROUP BY u.id
ORDER BY total_submissions DESC;


-- ============================================
-- 6. FIND SUBMISSION IDS
-- Get IDs to verify/reject submissions
-- ============================================

-- Get ALL submission IDs
SELECT 
  id,
  "wasteType",
  status,
  "pointsAwarded",
  location,
  "createdAt"
FROM "Submission"
ORDER BY "createdAt" DESC;

-- Get PENDING submissions only (ready for verification)
SELECT 
  id,
  "wasteType",
  location,
  LEFT("imageUrl", 50) as image_preview,
  "createdAt"
FROM "Submission"
WHERE status = 'PENDING'
ORDER BY "createdAt" DESC;

-- Get YOUR submissions
SELECT 
  id,
  "wasteType",
  status,
  "pointsAwarded",
  "createdAt"
FROM "Submission"
WHERE "userId" = 'user_34H1mCWspyCEKACIsL8KdVnt30D'
ORDER BY "createdAt" DESC;


-- ============================================
-- 7. VERIFY/REJECT SUBMISSIONS
-- Replace 'SUBMISSION_ID_HERE' with actual ID
-- ============================================

-- VERIFY a submission (approve and award points)
-- Step 1: Update submission status
UPDATE "Submission"
SET 
  status = 'VERIFIED',
  "pointsAwarded" = 50,
  "verifiedAt" = NOW(),
  "assignedAdminId" = 'user_34H1mCWspyCEKACIsL8KdVnt30D'
WHERE id = 'SUBMISSION_ID_HERE';

-- Step 2: Award points to user
UPDATE "User"
SET points = points + 50
WHERE id = (SELECT "userId" FROM "Submission" WHERE id = 'SUBMISSION_ID_HERE');

-- Step 3: Create points history
INSERT INTO "PointsHistory" ("userId", "submissionId", points)
SELECT "userId", id::text, 50
FROM "Submission"
WHERE id = 'SUBMISSION_ID_HERE';

-- REJECT a submission
UPDATE "Submission"
SET 
  status = 'REJECTED',
  "rejectionReason" = 'Image quality does not meet requirements',
  "assignedAdminId" = 'user_34H1mCWspyCEKACIsL8KdVnt30D'
WHERE id = 'SUBMISSION_ID_HERE';


-- ============================================
-- 8. COMMON FIXES
-- Solutions to frequent problems
-- ============================================

-- Fix 1: Make someone else admin
UPDATE "User" 
SET role = 'ADMIN', level = 'PLATINUM'
WHERE id = 'their_clerk_user_id';

-- Fix 2: Add missing imagePath (if old submissions)
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

-- Fix 4: Update user levels based on points
UPDATE "User" SET level = 'BRONZE' WHERE points < 100;
UPDATE "User" SET level = 'SILVER' WHERE points >= 100 AND points < 500;
UPDATE "User" SET level = 'GOLD' WHERE points >= 500 AND points < 1000;
UPDATE "User" SET level = 'PLATINUM' WHERE points >= 1000;

-- Fix 5: Delete orphaned submissions
DELETE FROM "Submission"
WHERE "userId" NOT IN (SELECT id FROM "User");

-- Fix 6: Add a new user manually
INSERT INTO "User" (id, name, email, role, level, points, status)
VALUES (
  'clerk_user_id_here',
  'User Name',
  'user@email.com',
  'USER',
  'BRONZE',
  0,
  'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 9. REPORTING & STATISTICS
-- Get insights about your system
-- ============================================

-- Overall system stats
SELECT 
  (SELECT COUNT(*) FROM "User") as total_users,
  (SELECT COUNT(*) FROM "User" WHERE role = 'ADMIN') as admins,
  (SELECT COUNT(*) FROM "Submission") as total_submissions,
  (SELECT COUNT(*) FROM "Submission" WHERE status = 'PENDING') as pending,
  (SELECT COUNT(*) FROM "Submission" WHERE status = 'VERIFIED') as verified,
  (SELECT COUNT(*) FROM "Submission" WHERE status = 'REJECTED') as rejected,
  (SELECT SUM(points) FROM "User") as total_points_awarded;

-- Top users by points
SELECT 
  name,
  email,
  level,
  points,
  (SELECT COUNT(*) FROM "Submission" WHERE "userId" = "User".id) as submissions
FROM "User"
ORDER BY points DESC
LIMIT 10;

-- Submissions by waste type
SELECT 
  "wasteType",
  COUNT(*) as count,
  SUM("pointsAwarded") as total_points
FROM "Submission"
WHERE status = 'VERIFIED'
GROUP BY "wasteType"
ORDER BY count DESC;

-- Submissions by location
SELECT 
  location,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END) as verified
FROM "Submission"
GROUP BY location
ORDER BY total DESC;

-- Daily submission trends (last 7 days)
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as submissions,
  COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END) as verified
FROM "Submission"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;


-- ============================================
-- 10. CLEANUP OPERATIONS
-- Use with caution!
-- ============================================

-- Remove duplicate users (keep oldest)
DELETE FROM "User" a 
USING "User" b
WHERE a.id > b.id AND a.email = b.email;

-- Delete old rejected submissions (>30 days)
-- DELETE FROM "Submission"
-- WHERE status = 'REJECTED' 
-- AND "createdAt" < NOW() - INTERVAL '30 days';

-- Vacuum database (optimize)
-- VACUUM ANALYZE;


-- ============================================
-- QUICK START GUIDE
-- ============================================

/*
FIRST TIME SETUP:
1. Run SECTION 1 (Create tables)
2. Run SECTION 2 (Add yourself as admin)
3. Create storage bucket 'waste-images' in Supabase Dashboard
4. Run SECTION 3 (Storage policies)
5. Run SECTION 4 (Verify setup)

IF IMAGES DON'T SHOW ON ADMIN PAGE:
1. Run all queries in SECTION 5 (Diagnostics)
2. Check for ❌ marks
3. If orphaned_count > 0, users are missing
4. If has_imagePath shows ❌, run Fix 2 from SECTION 8
5. Restart dev server: npm run dev

TO VERIFY A SUBMISSION:
1. Run SECTION 6 to get submission IDs
2. Copy the ID you want to verify
3. In SECTION 7, replace 'SUBMISSION_ID_HERE' with the ID
4. Run all 3 steps in order

TROUBLESHOOTING:
- "Forbidden" error → You're not admin (run SECTION 2)
- Empty submissions → Upload test image from /dashboard
- No users → Run Fix 6 in SECTION 8
- Wrong points → Run Fix 3 in SECTION 8

YOUR CLERK USER ID:
user_34H1mCWspyCEKACIsL8KdVnt30D
(Already filled in throughout this file!)
*/

-- ============================================
-- END OF MASTER SQL FILE
-- ============================================
