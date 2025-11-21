-- Migrate all existing pin_hash values from bcrypt to SHA-256 format
-- Set all existing users' PIN to 123456 with SHA-256 hash

UPDATE profiles 
SET pin_hash = encode(digest('123456', 'sha256'), 'hex')
WHERE pin_hash IS NOT NULL 
  AND pin_hash != ''
  AND length(pin_hash) > 32; -- bcrypt hashes are longer than SHA-256

-- This converts all old bcrypt hashes to SHA-256 hash of "123456"
-- After this migration, all users can login with username + 123456 PIN