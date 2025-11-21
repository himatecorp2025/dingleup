
-- Update all existing users' PIN to 123456 (default PIN)
-- This enables existing users to login with username + PIN 123456

-- Note: bcrypt hash for "123456" generated with bcrypt.hash("123456")
-- Each deployment will have slightly different hash due to salt, but all will validate against "123456"
-- We'll use a consistent bcrypt hash for simplicity: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdTL85iqe

UPDATE profiles
SET pin_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdTL85iqe'
WHERE pin_hash IS NULL OR pin_hash = '';

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % user(s) with default PIN 123456', updated_count;
END $$;
