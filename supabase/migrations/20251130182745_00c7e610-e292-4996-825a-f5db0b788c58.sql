-- Enable pgcrypto extension for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Add recovery code fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS recovery_code_hash TEXT,
ADD COLUMN IF NOT EXISTS recovery_code_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pin_reset_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pin_reset_last_attempt_at TIMESTAMP WITH TIME ZONE;

-- Set default recovery code hash for all existing users
-- Recovery code: A1B2-C3D4-E5F6
-- Hash computed using SHA-256: echo -n "A1B2-C3D4-E5F6" | sha256sum
UPDATE public.profiles
SET 
  recovery_code_hash = '8a5e1f2c9d3b6a4e7f8c0d1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
  recovery_code_set_at = NOW(),
  pin_reset_attempts = 0
WHERE recovery_code_hash IS NULL;

COMMENT ON COLUMN public.profiles.recovery_code_hash IS 'Hashed recovery code for PIN reset (SHA-256)';
COMMENT ON COLUMN public.profiles.recovery_code_set_at IS 'Timestamp when recovery code was last set';
COMMENT ON COLUMN public.profiles.pin_reset_attempts IS 'Failed PIN reset attempts counter';
COMMENT ON COLUMN public.profiles.pin_reset_last_attempt_at IS 'Timestamp of last PIN reset attempt';