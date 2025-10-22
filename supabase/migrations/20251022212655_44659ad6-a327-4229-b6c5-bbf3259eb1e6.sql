-- CRITICAL FIX: Remove the policy that exposes all profile data to authenticated users
-- This was a security mistake - it allows any logged in user to see ALL profiles with emails

DROP POLICY IF EXISTS "Authenticated users can search profiles" ON public.profiles;

-- Now the profiles table has only two SELECT policies:
-- 1. "Users can view own complete profile" - for viewing your own data
-- 2. "Only admins can view all profiles" - for admin access

-- For user search functionality, applications should use the public_profiles view
-- which only exposes safe fields: id, username, avatar_url, invitation_code, created_at
-- This view already has GRANT SELECT for authenticated and anon users