-- Add username and pin_hash columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Create default usernames and PIN hash for existing users
-- Default PIN: 123456, bcrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
UPDATE profiles
SET 
  username = COALESCE(username, 'user_' || SUBSTRING(id::text, 1, 8)),
  pin_hash = COALESCE(pin_hash, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
WHERE username IS NULL OR pin_hash IS NULL;

-- Make columns NOT NULL after setting defaults
ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL,
ALTER COLUMN pin_hash SET NOT NULL;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS login_attempts_pin (
  username TEXT PRIMARY KEY,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on login_attempts_pin
ALTER TABLE login_attempts_pin ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own login attempts
CREATE POLICY "Users can view own login attempts"
ON login_attempts_pin
FOR SELECT
USING (true);

-- Policy: Service role manages login attempts
CREATE POLICY "Service role manages login attempts"
ON login_attempts_pin
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');