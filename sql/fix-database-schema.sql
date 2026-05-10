-- ============================================
-- SQL MIGRATION: Fix Database Schema
-- Goal: Create notifications table and fix PointsHistory schema
-- ============================================

-- 1. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,
  actionUrl TEXT,
  imageUrl TEXT,
  isRead BOOLEAN DEFAULT FALSE,
  readAt TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create email_logs table if it doesn't exist (used by the system)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId TEXT,
  toEmail TEXT NOT NULL,
  subject TEXT NOT NULL,
  templateType TEXT,
  status TEXT DEFAULT 'PENDING',
  errorMessage TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  emailUploadStatus BOOLEAN DEFAULT TRUE,
  emailRewards BOOLEAN DEFAULT TRUE,
  emailAnnouncements BOOLEAN DEFAULT TRUE,
  emailWeeklySummary BOOLEAN DEFAULT TRUE,
  emailMarketing BOOLEAN DEFAULT FALSE,
  emailPickups BOOLEAN DEFAULT TRUE,
  emailCampaigns BOOLEAN DEFAULT TRUE,
  pushUploadStatus BOOLEAN DEFAULT TRUE,
  pushRewards BOOLEAN DEFAULT TRUE,
  pushAnnouncements BOOLEAN DEFAULT TRUE,
  pushPickups BOOLEAN DEFAULT TRUE,
  pushCampaigns BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Fix PointsHistory table - add description column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'PointsHistory'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE "PointsHistory" ADD COLUMN description TEXT;
    END IF;
END $$;

-- 5. Add RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = userId);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = userId);

-- 6. Add RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid()::text = userId);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPSERT
  WITH CHECK (auth.uid()::text = userId);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON notifications(isRead);
CREATE INDEX IF NOT EXISTS idx_email_logs_userId ON email_logs(userId);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
