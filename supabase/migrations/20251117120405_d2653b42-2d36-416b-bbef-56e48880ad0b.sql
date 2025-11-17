-- Remove all booster and speed booster related database structures

-- Drop user_boosters table if exists
DROP TABLE IF EXISTS public.user_boosters CASCADE;

-- Remove speed_multiplier column from profiles if exists
ALTER TABLE public.profiles DROP COLUMN IF EXISTS speed_multiplier;

-- Remove any booster-related indexes
DROP INDEX IF EXISTS idx_user_boosters_user_active;
DROP INDEX IF EXISTS idx_user_boosters_expiry;