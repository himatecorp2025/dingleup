-- Fix recovery code hash for existing users using correct PostgreSQL digest function
-- The previous migration used a hard-coded hash value that doesn't match the actual SHA-256 hash

UPDATE public.profiles
SET 
  recovery_code_hash = encode(extensions.digest('A1B2-C3D4-E5F6', 'sha256'), 'hex'),
  recovery_code_set_at = NOW()
WHERE recovery_code_hash = '8a5e1f2c9d3b6a4e7f8c0d1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b';

-- Also update any NULL recovery_code_hash that might exist
UPDATE public.profiles
SET 
  recovery_code_hash = encode(extensions.digest('A1B2-C3D4-E5F6', 'sha256'), 'hex'),
  recovery_code_set_at = NOW()
WHERE recovery_code_hash IS NULL;