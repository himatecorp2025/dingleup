-- Enable extensions for fast searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index for fast case-insensitive searching on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower_trgm
  ON profiles USING gin (lower(username) gin_trgm_ops);

-- Additional index for prefix searches
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON profiles (lower(username));