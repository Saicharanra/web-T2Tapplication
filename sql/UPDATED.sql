-- ============================================
-- 🔥 COMPLETE DATABASE (UPDATED PRODUCTION)
-- ============================================

-- ============================================
-- 📦 STORAGE PROVIDERS & DIRECTORY STRUCTURES
-- ============================================
--
-- 1. Firebase Storage:
--    - Used for: Recycling bin photographs (e.g., when users add or verify bin locations).
--    - Directory/Path structure: `bins/${userId}_${timestamp}_${cleanFileName}`
--    - Associated functions: `uploadBinImage` in `lib/firebase/storage.ts`
--
-- 2. Cloudinary:
--    - Used for: Waste scan submissions / proof of recycling uploads.
--    - Directory/Path structure: `submissions/${userId}/${submissionId}`
--    - Associated API route: `app/api/upload/route.ts`
--
-- 3. Database field mappings (e.g., in "Submission" table):
--    - "imageUrl": The public HTTP download URL of the image.
--    - "imagePath": The folder/file path or public ID in the storage provider.
--    - "imageSize": The file size in bytes.
--    - "imageMimeType": The MIME type (e.g., 'image/jpeg', 'image/png').
--
-- ============================================

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 👤 USER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  "imageUrl" TEXT,

  role TEXT DEFAULT 'USER' CHECK (role IN ('USER','ADMIN')),
  level TEXT DEFAULT 'BRONZE' CHECK (level IN ('BRONZE','SILVER','GOLD','PLATINUM')),
  points INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),

  location TEXT,
  "joinedAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Auto update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_updated_at
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- ♻️ SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS "Submission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  "wasteType" TEXT NOT NULL,

  "imageUrl" TEXT NOT NULL,
  "imagePath" TEXT,
  "imageSize" INTEGER,
  "imageMimeType" TEXT,

  "pointsAwarded" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','VERIFIED','REJECTED')),

  location TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "verifiedAt" TIMESTAMP,
  "assignedAdminId" TEXT,
  "rejectionReason" TEXT
);


-- ============================================
-- ⭐ POINTS HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS "PointsHistory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT REFERENCES "User"(id),
  "submissionId" TEXT,
  points INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- 🎁 REWARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "Reward" (
  reward_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  image_url TEXT DEFAULT '🎁',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  category TEXT DEFAULT 'General',
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger for Reward updated_at
CREATE OR REPLACE FUNCTION update_reward_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reward_time
BEFORE UPDATE ON "Reward"
FOR EACH ROW
EXECUTE FUNCTION update_reward_updated_at();


-- ============================================
-- 🎟️ COUPON / CODE TABLE (CRITICAL)
-- ============================================
CREATE TABLE IF NOT EXISTS "RewardCode" (
  id SERIAL PRIMARY KEY,
  reward_id INTEGER REFERENCES "Reward"(reward_id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,

  is_used BOOLEAN DEFAULT FALSE,
  used_by TEXT REFERENCES "User"(id),
  used_at TIMESTAMP,

  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- 📜 REDEMPTION HISTORY
-- (Maps to Firestore 'redemptions' collection)
-- ============================================
CREATE TABLE IF NOT EXISTS "RewardRedemption" (
  redemption_id SERIAL PRIMARY KEY,

  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE, -- Firestore: user_id field
  reward_id INTEGER REFERENCES "Reward"(reward_id),     -- Firestore: reward_id field
  code_id INTEGER REFERENCES "RewardCode"(id),          -- Optional link to pre-generated codes
  code TEXT,                                            -- Added: The actual redemption code (e.g., 'RWD-A1B2C3')

  redeemed_at TIMESTAMP DEFAULT NOW(),                  -- Firestore: redeemed_at field (timestamp)
  expires_at TIMESTAMP,
  status TEXT DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','EXPIRED','USED')),
  used_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX unique_code_usage 
ON "RewardRedemption"(code_id);

CREATE OR REPLACE FUNCTION update_redemption_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_redemption_time
BEFORE UPDATE ON "RewardRedemption"
FOR EACH ROW
EXECUTE FUNCTION update_redemption_updated_at();

CREATE UNIQUE INDEX unique_user_reward
ON "RewardRedemption"(user_id, reward_id);



-- ============================================
-- ⚡ INDEXES (PERFORMANCE)
-- ============================================
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_submission_user ON "Submission"("userId");
CREATE INDEX idx_submission_status ON "Submission"(status);
CREATE INDEX idx_reward_status ON "Reward"(status);
CREATE INDEX idx_code_available ON "RewardCode"(reward_id, is_used);
CREATE INDEX idx_redemption_user ON "RewardRedemption"(user_id);


-- ============================================
-- 🔥 SAMPLE DATA (OPTIONAL)
-- ============================================

-- Example Reward
INSERT INTO "Reward" (title, description, points_required, category, stock)
VALUES 
('McDonalds ₹100 Gift Card', 'Use at any McDonalds store', 1000, 'Food', 20);

-- Example Codes
INSERT INTO "RewardCode" (reward_id, code)
VALUES
(1, 'MCD-A1B2C3'),
(1, 'MCD-X9Y8Z7'),
(1, 'MCD-KL88MN'),
(1, 'MCD-RT45GH');