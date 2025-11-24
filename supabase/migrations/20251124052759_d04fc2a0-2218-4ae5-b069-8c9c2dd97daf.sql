-- Set age_verified = true and birth_date for all existing users
-- This ensures existing users won't see the Age Gate popup
-- Only new users (registered after this migration) will see the Age Gate

UPDATE public.profiles
SET 
  age_verified = true,
  birth_date = '2000-01-01',
  age_consent = true,
  first_login_age_gate_completed = true
WHERE age_verified IS NULL OR age_verified = false OR birth_date IS NULL;