-- ============================================
-- REWARDS MODULE - DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Create Rewards Table
-- ============================================
CREATE TABLE IF NOT EXISTS "Rewards" (
  reward_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  image_url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  category VARCHAR(100) DEFAULT 'General',
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Create Reward_Redemptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS "Reward_Redemptions" (
  redemption_id SERIAL PRIMARY KEY,
  reward_id INTEGER NOT NULL REFERENCES "Rewards"(reward_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rewards_status ON "Rewards"(status);
CREATE INDEX IF NOT EXISTS idx_rewards_category ON "Rewards"(category);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON "Rewards"(created_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_reward_id ON "Reward_Redemptions"(reward_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON "Reward_Redemptions"(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed_at ON "Reward_Redemptions"(redeemed_at);

-- ============================================
-- 4. Auto-update trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rewards_updated_at_trigger ON "Rewards";

CREATE TRIGGER update_rewards_updated_at_trigger
  BEFORE UPDATE ON "Rewards"
  FOR EACH ROW
  EXECUTE FUNCTION update_rewards_updated_at();

-- ============================================
-- 5. RLS Policies (optional - service role key bypasses RLS)
-- ============================================
ALTER TABLE "Rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reward_Redemptions" ENABLE ROW LEVEL SECURITY;

-- Allow public read on active rewards
CREATE POLICY "Public can view active rewards"
ON "Rewards" FOR SELECT
TO public
USING (status = 'Active');

-- Allow service role full access (used by API routes)
CREATE POLICY "Service role full access on Rewards"
ON "Rewards" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on Reward_Redemptions"
ON "Reward_Redemptions" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. Seed Data (Optional - remove if not needed)
-- ============================================
INSERT INTO "Rewards" (title, description, points_required, image_url, status, category, stock) VALUES
  ('Eco Tote Bag', 'Premium recycled cotton tote bag with T2T branding', 200, '🛍️', 'Active', 'Merchandise', 45),
  ('Plant a Tree', 'We plant a tree in your name in Telangana forests', 500, '🌳', 'Active', 'Environment', 999),
  ('₹100 Gift Card', 'Digital gift card redeemable at partner stores', 1000, '💳', 'Active', 'Gift Cards', 30),
  ('Bamboo Water Bottle', 'Sustainable bamboo water bottle, 500ml capacity', 350, '🍶', 'Inactive', 'Merchandise', 0),
  ('Eco Workshop Pass', 'Free attendance to our monthly sustainability workshop', 150, '🎓', 'Active', 'Experiences', 20),
  ('Premium Badge', 'Exclusive Gold Recycler badge for your profile', 800, '🏅', 'Active', 'Digital', 999)
ON CONFLICT DO NOTHING;

SELECT '✅ Rewards module tables created successfully!' as result;
