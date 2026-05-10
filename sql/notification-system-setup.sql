-- ============================================
-- NOTIFICATION SYSTEM SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "notifications" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,

  -- Notification content
  type TEXT NOT NULL DEFAULT 'GENERAL'
    CHECK (type IN (
      'UPLOAD_APPROVED', 'UPLOAD_REJECTED',
      'REWARD_POINTS', 'REWARD_REDEEMED',
      'ACCOUNT_WELCOME',
      'ADMIN_ANNOUNCEMENT',
      'PICKUP_SCHEDULED', 'PICKUP_COMPLETED',
      'CAMPAIGN', 'REFERRAL',
      'WEEKLY_REPORT', 'GENERAL'
    )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Optional metadata
  metadata JSONB DEFAULT '{}',
  icon TEXT,             -- emoji or icon name
  "actionUrl" TEXT,      -- link to navigate to
  "imageUrl" TEXT,       -- optional image

  -- Timestamps
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "readAt" TIMESTAMP WITH TIME ZONE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_type ON "notifications"(type);
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON "notifications"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_userId_unread ON "notifications"("userId", "isRead") WHERE "isRead" = FALSE;

-- ============================================
-- 2. EMAIL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "email_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,

  -- Email details
  "toEmail" TEXT NOT NULL,
  subject TEXT NOT NULL,
  "templateType" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'RETRYING')),
  
  -- Tracking
  "errorMessage" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 3,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "sentAt" TIMESTAMP WITH TIME ZONE,
  "lastRetryAt" TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_emaillogs_userId ON "email_logs"("userId");
CREATE INDEX IF NOT EXISTS idx_emaillogs_status ON "email_logs"(status);
CREATE INDEX IF NOT EXISTS idx_emaillogs_createdAt ON "email_logs"("createdAt" DESC);

-- ============================================
-- 3. NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "notification_preferences" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,

  -- Email preferences
  "emailUploadStatus" BOOLEAN NOT NULL DEFAULT TRUE,
  "emailRewards" BOOLEAN NOT NULL DEFAULT TRUE,
  "emailAnnouncements" BOOLEAN NOT NULL DEFAULT TRUE,
  "emailWeeklySummary" BOOLEAN NOT NULL DEFAULT TRUE,
  "emailMarketing" BOOLEAN NOT NULL DEFAULT FALSE,
  "emailPickups" BOOLEAN NOT NULL DEFAULT TRUE,
  "emailCampaigns" BOOLEAN NOT NULL DEFAULT TRUE,

  -- In-app notification preferences
  "pushUploadStatus" BOOLEAN NOT NULL DEFAULT TRUE,
  "pushRewards" BOOLEAN NOT NULL DEFAULT TRUE,
  "pushAnnouncements" BOOLEAN NOT NULL DEFAULT TRUE,
  "pushPickups" BOOLEAN NOT NULL DEFAULT TRUE,
  "pushCampaigns" BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE("userId")
);

CREATE INDEX IF NOT EXISTS idx_notifpref_userId ON "notification_preferences"("userId");

-- ============================================
-- 4. ENABLE REALTIME ON NOTIFICATIONS TABLE
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE "notifications";

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

-- Notifications RLS
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON "notifications" FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Service role can insert notifications"
ON "notifications" FOR INSERT
TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "Users can update own notifications"
ON "notifications" FOR UPDATE
TO authenticated
USING (TRUE);

CREATE POLICY "Users can delete own notifications"
ON "notifications" FOR DELETE
TO authenticated
USING (TRUE);

-- email_logs RLS
ALTER TABLE "email_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage email logs"
ON "email_logs" FOR ALL
TO authenticated
USING (TRUE);

-- notification_preferences RLS
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
ON "notification_preferences" FOR ALL
TO authenticated
USING (TRUE);

-- ============================================
-- 6. VERIFY SETUP
-- ============================================
SELECT 
  'notifications' as table_name,
  COUNT(*) as row_count
FROM "notifications"
UNION ALL
SELECT 'email_logs', COUNT(*) FROM "email_logs"
UNION ALL
SELECT 'notification_preferences', COUNT(*) FROM "notification_preferences";
