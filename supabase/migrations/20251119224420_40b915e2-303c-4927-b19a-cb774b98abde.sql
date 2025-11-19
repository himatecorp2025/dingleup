
-- Delete the problematic user profile to allow clean re-registration
DELETE FROM profiles WHERE email = 'wtf001@gmail.com' OR username = 'Wtf001';

-- Note: This will allow the user to register again from scratch
-- The auth.users entry will be cleaned up automatically by Supabase when re-registering with same email
