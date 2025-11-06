-- ============================================
-- CLERK WEBHOOK - COMPLETE SETUP GUIDE
-- Single SQL file for Clerk authentication integration
-- ============================================

-- ============================================
-- TABLE OF CONTENTS
-- ============================================
-- 1. USER TABLE SCHEMA (Clerk-Compatible)
-- 2. WEBHOOK SUPPORT (updatedAt & Trigger)
-- 3. VERIFY CLERK COMPATIBILITY
-- 4. TEST WEBHOOK FUNCTIONALITY
-- 5. WEBHOOK DIAGNOSTICS
-- 6. USER MANAGEMENT OPERATIONS
-- 7. TROUBLESHOOTING & FIXES

-- ============================================
-- IMPORTANT NOTES
-- ============================================
/*
✅ WHAT CLERK WEBHOOK SENDS:
- user.id (Clerk user ID - e.g., user_2abc123xyz)
- first_name (nullable)
- last_name (nullable)
- email_addresses[0].email_address
- image_url (profile picture URL)

✅ WEBHOOK EVENTS SUPPORTED:
- user.created → Creates new user in database
- user.updated → Updates existing user (requires updatedAt column)
- user.deleted → Removes user from database

✅ DATABASE COLUMNS MAPPED:
- id → user.id (Clerk user ID)
- name → first_name + last_name combined
- email → email_addresses[0].email_address
- imageUrl → user.image_url (OPTIONAL - add column if needed)
- role → Default: 'USER' (set manually for admins)
- level → Default: 'BRONZE'
- points → Default: 0
- status → Default: 'ACTIVE'
- joinedAt → Default: NOW()
- updatedAt → Auto-updated on every change (REQUIRED for webhooks)

⚠️ CRITICAL REQUIREMENTS:
1. updatedAt column MUST exist for user.updated events
2. Auto-update trigger MUST be created
3. id column MUST be TEXT (not UUID) to match Clerk IDs
4. email MUST be unique
*/

-- ============================================
-- 1. USER TABLE SCHEMA (Clerk-Compatible)
-- Run this if creating table from scratch
-- ============================================

-- Create User Table with Clerk webhook support
CREATE TABLE IF NOT EXISTS "User" (
  -- Clerk fields
  id TEXT PRIMARY KEY,                                    -- Clerk user ID (e.g., user_2abc123xyz)
  name TEXT NOT NULL,                                     -- first_name + last_name
  email TEXT UNIQUE NOT NULL,                             -- Primary email
  "imageUrl" TEXT,                                        -- Profile picture (OPTIONAL)
  
  -- Application fields
  role TEXT NOT NULL DEFAULT 'USER' 
    CHECK (role IN ('USER', 'ADMIN')),
  location TEXT,                                          -- User location (set by user later)
  level TEXT NOT NULL DEFAULT 'BRONZE' 
    CHECK (level IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE' 
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  
  -- Timestamps
  "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()      -- ⭐ REQUIRED for webhooks
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_status ON "User"(status);

-- ============================================
-- 2. WEBHOOK SUPPORT (updatedAt & Trigger)
-- Run this to enable user.updated webhook events
-- ============================================

-- Add updatedAt column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE '✅ Added updatedAt column';
  ELSE
    RAISE NOTICE 'ℹ️ updatedAt column already exists';
  END IF;
END $$;

-- Add imageUrl column if it doesn't exist (OPTIONAL but recommended)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'imageUrl'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "imageUrl" TEXT;
    RAISE NOTICE '✅ Added imageUrl column';
  ELSE
    RAISE NOTICE 'ℹ️ imageUrl column already exists';
  END IF;
END $$;

-- Create auto-update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any and recreate
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";

-- Create trigger to auto-update updatedAt
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. VERIFY CLERK COMPATIBILITY
-- Check if your User table is webhook-ready
-- ============================================

-- Check all required columns exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'id' AND data_type = 'text') 
    THEN '✅ id (TEXT)' 
    ELSE '❌ id MISSING or wrong type' END as col_id,
    
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'name') 
    THEN '✅ name' 
    ELSE '❌ name MISSING' END as col_name,
    
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'email') 
    THEN '✅ email' 
    ELSE '❌ email MISSING' END as col_email,
    
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'imageUrl') 
    THEN '✅ imageUrl' 
    ELSE '⚠️ imageUrl OPTIONAL (recommended)' END as col_imageUrl,
    
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'role') 
    THEN '✅ role' 
    ELSE '❌ role MISSING' END as col_role,
    
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'updatedAt') 
    THEN '✅ updatedAt (REQUIRED)' 
    ELSE '❌ updatedAt MISSING - Run Section 2!' END as col_updatedAt;

-- Verify trigger exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE event_object_table = 'User' 
      AND trigger_name = 'update_user_updated_at'
    )
    THEN '✅ Auto-update trigger active'
    ELSE '❌ Trigger missing - Run Section 2!'
  END as trigger_status;

-- Show current table structure
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- ============================================
-- 4. TEST WEBHOOK FUNCTIONALITY
-- Simulate webhook operations
-- ============================================

-- Test 1: Simulate user.created webhook
-- (Replace values with test data)
INSERT INTO "User" (id, name, email, "imageUrl", role, level, points, status)
VALUES (
  'user_test_clerk_123abc',                              -- Clerk user ID format
  'Test User',                                           -- first_name + last_name
  'testuser@clerk.test',                                 -- email_addresses[0]
  'https://img.clerk.com/test.jpg',                      -- image_url
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

-- Test 2: Verify auto-update works (simulate user.updated)
UPDATE "User"
SET name = 'Updated Test User'
WHERE id = 'user_test_clerk_123abc';

-- Test 3: Check if updatedAt changed
SELECT 
  id,
  name,
  email,
  "updatedAt",
  CASE 
    WHEN "updatedAt" > "joinedAt" THEN '✅ updatedAt is working'
    ELSE '⚠️ updatedAt not updating'
  END as status
FROM "User"
WHERE id = 'user_test_clerk_123abc';

-- Test 4: Clean up test user (simulate user.deleted)
DELETE FROM "User" WHERE id = 'user_test_clerk_123abc';

-- ============================================
-- 5. WEBHOOK DIAGNOSTICS
-- Debug webhook sync issues
-- ============================================

-- Check recent users (from webhook)
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
    ELSE '⚠️ Non-standard ID'
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
  "updatedAt"
FROM "User"
WHERE "updatedAt" IS NULL
ORDER BY "joinedAt" DESC;

-- Check for duplicate emails (webhook will fail on these)
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id, ', ') as user_ids
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;

-- Find users missing required fields
SELECT 
  id,
  name,
  email,
  CASE WHEN name IS NULL OR name = '' THEN '❌ Missing name' ELSE '✅' END as has_name,
  CASE WHEN email IS NULL OR email = '' THEN '❌ Missing email' ELSE '✅' END as has_email,
  CASE WHEN role IS NULL THEN '❌ Missing role' ELSE '✅' END as has_role
FROM "User"
WHERE name IS NULL OR name = '' OR email IS NULL OR email = '' OR role IS NULL;

-- Overall webhook health check
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN id LIKE 'user_%' THEN 1 END) as clerk_users,
  COUNT(CASE WHEN "updatedAt" IS NOT NULL THEN 1 END) as has_updated_at,
  COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admin_count,
  COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_users,
  MIN("joinedAt") as first_user,
  MAX("joinedAt") as latest_user
FROM "User";

-- ============================================
-- 6. USER MANAGEMENT OPERATIONS
-- Common admin tasks
-- ============================================

-- Make user an admin (manually promote)
-- Replace with actual Clerk user ID
UPDATE "User" 
SET 
  role = 'ADMIN',
  level = 'PLATINUM'
WHERE id = 'user_YOUR_CLERK_ID_HERE';

-- Verify admin status
SELECT 
  id,
  name,
  email,
  role,
  level,
  CASE 
    WHEN role = 'ADMIN' THEN '✅ Admin access granted'
    ELSE '⚠️ Regular user'
  END as admin_status
FROM "User"
WHERE id = 'user_YOUR_CLERK_ID_HERE';

-- List all admins
SELECT 
  id,
  name,
  email,
  level,
  points,
  "joinedAt"
FROM "User"
WHERE role = 'ADMIN'
ORDER BY "joinedAt" DESC;

-- Bulk update user levels based on points
UPDATE "User" SET level = 'BRONZE' WHERE points < 100;
UPDATE "User" SET level = 'SILVER' WHERE points >= 100 AND points < 500;
UPDATE "User" SET level = 'GOLD' WHERE points >= 500 AND points < 1000;
UPDATE "User" SET level = 'PLATINUM' WHERE points >= 1000;

-- Deactivate user (without deleting)
UPDATE "User"
SET status = 'INACTIVE'
WHERE id = 'user_clerk_id_to_deactivate';

-- Reactivate user
UPDATE "User"
SET status = 'ACTIVE'
WHERE id = 'user_clerk_id_to_reactivate';

-- ============================================
-- 7. TROUBLESHOOTING & FIXES
-- Solutions to common webhook issues
-- ============================================

-- Fix 1: Add missing updatedAt values
UPDATE "User"
SET "updatedAt" = "joinedAt"
WHERE "updatedAt" IS NULL;

-- Fix 2: Standardize empty names
UPDATE "User"
SET name = 'User ' || SUBSTRING(id FROM 6 FOR 8)
WHERE name IS NULL OR name = '' OR TRIM(name) = '';

-- Fix 3: Remove duplicate users (keep oldest)
DELETE FROM "User" a 
USING "User" b
WHERE a.id > b.id AND a.email = b.email;

-- Fix 4: Sync imageUrl from Clerk (manual update)
-- Use this if webhook didn't set profile pictures
UPDATE "User"
SET "imageUrl" = 'https://img.clerk.com/eyJ0...'  -- Get from Clerk Dashboard
WHERE id = 'user_specific_clerk_id';

-- Fix 5: Reset all updatedAt timestamps
UPDATE "User"
SET "updatedAt" = NOW();

-- Fix 6: Add default location for existing users
UPDATE "User"
SET location = 'Not specified'
WHERE location IS NULL;

-- ============================================
-- WEBHOOK VERIFICATION CHECKLIST
-- ============================================

/*
✅ PRE-WEBHOOK SETUP CHECKLIST:

□ User table exists with TEXT id column
□ updatedAt column exists
□ Auto-update trigger created and active
□ Email column has UNIQUE constraint
□ All required columns exist (id, name, email, role, etc.)
□ imageUrl column added (optional but recommended)

✅ CLERK DASHBOARD SETUP:

1. Go to Clerk Dashboard → Webhooks
2. Click "Add Endpoint"
3. Enter your webhook URL: https://yourdomain.com/api/webhooks/clerk
4. Select events:
   □ user.created
   □ user.updated
   □ user.deleted
5. Copy webhook secret → Add to .env as CLERK_WEBHOOK_SECRET

✅ ENVIRONMENT VARIABLES:

Add to .env.local:
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

✅ WEBHOOK ROUTE IMPLEMENTATION:

Your /app/api/webhooks/clerk/route.ts should:
□ Import svix package
□ Verify webhook signature
□ Handle user.created (INSERT or UPSERT)
□ Handle user.updated (UPDATE with updatedAt)
□ Handle user.deleted (DELETE)
□ Return 200 response

✅ POST-WEBHOOK TESTING:

1. Sign up new user in Clerk
2. Check terminal logs for: "User synced to Supabase"
3. Run Section 5 diagnostics
4. Verify user appears in database
5. Update user in Clerk Dashboard
6. Check if updatedAt changed in database
7. Delete test user in Clerk
8. Verify user removed from database

✅ COMMON WEBHOOK ERRORS:

Error: "Invalid signature"
→ Check CLERK_WEBHOOK_SECRET matches Dashboard

Error: "duplicate key value violates unique constraint"
→ User already exists, webhook trying to create again
→ Use UPSERT instead of INSERT

Error: "null value in column 'updatedAt'"
→ Run Section 2 to add column and trigger

Error: "column 'imageUrl' does not exist"
→ Either add column or remove from webhook handler

Error: "relation 'User' does not exist"
→ Run Section 1 to create table
*/

-- ============================================
-- QUICK START GUIDE
-- ============================================

/*
🚀 FIRST TIME SETUP (Step-by-Step):

1. CREATE TABLE
   → Run entire Section 1

2. ADD WEBHOOK SUPPORT
   → Run entire Section 2

3. VERIFY COMPATIBILITY
   → Run all queries in Section 3
   → Should see all ✅ checkmarks

4. TEST FUNCTIONALITY
   → Run Section 4 test sequence
   → Verify auto-update works

5. SETUP CLERK WEBHOOK
   → Add endpoint in Clerk Dashboard
   → Add CLERK_WEBHOOK_SECRET to .env

6. TEST WITH REAL USER
   → Sign up in your app
   → Check Section 5 diagnostics
   → User should appear in database

7. MAKE YOURSELF ADMIN
   → Use Section 6 admin promotion query
   → Verify admin access works

✅ DONE! Your Clerk webhook is fully integrated!
*/

-- ============================================
-- END OF CLERK WEBHOOK SETUP
-- ============================================
