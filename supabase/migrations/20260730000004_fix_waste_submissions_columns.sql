-- ============================================================
-- FIX: Add missing columns to public.waste_submissions table
-- Solves: PGRST204 - Could not find 'rejection_reason' or 'points_awarded'
-- ============================================================

ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General Waste';
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS weight NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,6);
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6);
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS image_size INTEGER DEFAULT 0;
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS image_mime_type VARCHAR(100) DEFAULT 'image/jpeg';
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(5,2);
ALTER TABLE public.waste_submissions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
