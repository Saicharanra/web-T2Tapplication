-- ============================================
-- ALTER USER TABLE FOR CLERK WEBHOOK COMPATIBILITY
-- Run this to update your existing User table
-- ============================================

-- Add updatedAt column if it doesn't exist
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

-- Create auto-update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFY THE CHANGES
-- ============================================

-- Check User table structure
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- Verify webhook-compatible columns exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'id') 
    THEN '✅ id' ELSE '❌ id MISSING' END as col_id,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'name') 
    THEN '✅ name' ELSE '❌ name MISSING' END as col_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'email') 
    THEN '✅ email' ELSE '❌ email MISSING' END as col_email,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'role') 
    THEN '✅ role' ELSE '❌ role MISSING' END as col_role,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'level') 
    THEN '✅ level' ELSE '❌ level MISSING' END as col_level,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'points') 
    THEN '✅ points' ELSE '❌ points MISSING' END as col_points,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'status') 
    THEN '✅ status' ELSE '❌ status MISSING' END as col_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'joinedAt') 
    THEN '✅ joinedAt' ELSE '❌ joinedAt MISSING' END as col_joinedAt,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'updatedAt') 
    THEN '✅ updatedAt' ELSE '❌ updatedAt MISSING' END as col_updatedAt;

-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'User';

-- Show current users
SELECT 
  id,
  name,
  email,
  role,
  level,
  points,
  status,
  "joinedAt",
  "updatedAt"
FROM "User"
ORDER BY "joinedAt" DESC;

-- ============================================
-- IMPORTANT NOTES
-- ============================================

/*
✅ WHAT THIS SCRIPT DOES:
1. Adds 'updatedAt' column if missing (automatically set to NOW())
2. Creates auto-update trigger so 'updatedAt' changes on every UPDATE
3. Verifies all webhook-required columns exist
4. Shows your current users

✅ YOUR TABLE IS ALREADY COMPATIBLE FOR:
- id (TEXT PRIMARY KEY) ✓
- name (TEXT NOT NULL) ✓
- email (TEXT UNIQUE NOT NULL) ✓
- role (TEXT with CHECK constraint) ✓
- level (TEXT with CHECK constraint) ✓
- points (INTEGER DEFAULT 0) ✓
- status (TEXT with CHECK constraint) ✓
- joinedAt (TIMESTAMP) ✓

✅ WEBHOOK COMPATIBILITY:
Your existing User table structure matches what the webhook expects.
The only addition is 'updatedAt' for tracking modifications.

⚠️ WHAT THE WEBHOOK WON'T INSERT:
- imageUrl (column doesn't exist - this is CORRECT)
- location (webhook doesn't send this - populated later by user)

🎯 AFTER RUNNING THIS SCRIPT:
1. All ✅ checkmarks should appear in the verification query
2. Test the webhook by signing up a new user
3. Check terminal logs for: "✅ User created successfully in Supabase"
4. Verify the new user appears in your User table

📝 YOUR EXISTING USERS:
All existing users will remain unchanged.
They will get 'updatedAt' set to NOW() automatically.
*/
