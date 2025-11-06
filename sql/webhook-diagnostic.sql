-- ============================================
-- WEBHOOK DIAGNOSTIC SCRIPT
-- Run this to check if database is ready
-- ============================================

-- 1. CHECK IF USER TABLE EXISTS
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'User'
    ) THEN '✅ User table EXISTS'
    ELSE '❌ User table MISSING - Run master-setup.sql Section 1'
  END as table_status;

-- 2. CHECK USER TABLE STRUCTURE
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  CASE 
    WHEN column_name = 'id' THEN '✅ Clerk User ID'
    WHEN column_name = 'name' THEN '✅ From Clerk'
    WHEN column_name = 'email' THEN '✅ From Clerk'
    WHEN column_name = 'role' THEN '✅ USER/ADMIN'
    WHEN column_name = 'level' THEN '✅ BRONZE/SILVER/GOLD/PLATINUM'
    WHEN column_name = 'points' THEN '✅ Points system'
    WHEN column_name = 'status' THEN '✅ ACTIVE/INACTIVE'
    WHEN column_name = 'joinedAt' THEN '✅ Signup date'
    WHEN column_name = 'updatedAt' THEN '✅ Last update (AUTO)'
    WHEN column_name = 'location' THEN '✅ Optional field'
    ELSE '⚠️ Unknown column'
  END as description
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- 3. CHECK REQUIRED COLUMNS FOR WEBHOOK
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'id') 
    THEN '✅' ELSE '❌' END as has_id,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'name') 
    THEN '✅' ELSE '❌' END as has_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'email') 
    THEN '✅' ELSE '❌' END as has_email,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'role') 
    THEN '✅' ELSE '❌' END as has_role,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'level') 
    THEN '✅' ELSE '❌' END as has_level,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'points') 
    THEN '✅' ELSE '❌' END as has_points,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'status') 
    THEN '✅' ELSE '❌' END as has_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'joinedAt') 
    THEN '✅' ELSE '❌' END as has_joinedAt,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'updatedAt') 
    THEN '✅' ELSE '❌' END as has_updatedAt;

-- 4. CHECK AUTO-UPDATE TRIGGER
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  CASE 
    WHEN trigger_name = 'update_user_updated_at' THEN '✅ Auto-update trigger exists'
    ELSE '⚠️ Different trigger'
  END as status
FROM information_schema.triggers
WHERE event_object_table = 'User';

-- 5. COUNT EXISTING USERS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'USER' THEN 1 END) as regular_users,
  COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as inactive
FROM "User";

-- 6. SHOW RECENT USERS
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
ORDER BY "joinedAt" DESC
LIMIT 5;

-- 7. TEST INSERT (to verify webhook will work)
-- This simulates what the webhook does
DO $$
DECLARE
  test_id TEXT := 'test_user_' || floor(random() * 1000000)::text;
BEGIN
  -- Try to insert a test user
  INSERT INTO "User" (id, name, email, role, level, points, status)
  VALUES (
    test_id,
    'Test User',
    'test_' || test_id || '@example.com',
    'USER',
    'BRONZE',
    0,
    'ACTIVE'
  );
  
  RAISE NOTICE '✅ Test insert successful - Webhook will work!';
  
  -- Clean up test user
  DELETE FROM "User" WHERE id = test_id;
  RAISE NOTICE '✅ Test user cleaned up';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Test insert failed: %', SQLERRM;
  RAISE NOTICE '⚠️ Fix this error before testing webhook';
END $$;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================

/*
ALL ✅ CHECKS PASSED:
- Your database is ready for webhooks
- The webhook will work correctly
- Proceed with Clerk webhook configuration

ANY ❌ FOUND:
- Run master-setup.sql Section 1 to create tables
- Or run alter-user-table-for-webhook.sql to add missing columns

IF TEST INSERT FAILS:
- Check the error message
- Usually means table doesn't exist or column mismatch
- Run master-setup.sql Section 1

NEXT STEPS:
1. Ensure all checks show ✅
2. Configure Clerk webhook with ngrok URL
3. Test by signing up a new user
4. Check terminal logs for webhook activity
*/
