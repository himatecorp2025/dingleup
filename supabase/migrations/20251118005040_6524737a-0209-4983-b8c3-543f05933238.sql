-- Make country_code NOT NULL with default HU
ALTER TABLE profiles 
ALTER COLUMN country_code SET DEFAULT 'HU',
ALTER COLUMN country_code SET NOT NULL;

-- Create index for faster country-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON profiles(country_code);

-- Update device_geo_analytics to ensure country tracking on every session
-- This helps track if user travels/moves to different countries
CREATE INDEX IF NOT EXISTS idx_device_geo_country_user ON device_geo_analytics(user_id, country_code, created_at DESC);