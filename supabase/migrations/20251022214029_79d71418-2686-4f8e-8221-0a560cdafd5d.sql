-- Fix: Make public_profiles view work correctly for edge functions
-- The issue is that SECURITY INVOKER views inherit RLS from underlying tables
-- which blocks edge functions from reading other users' profiles

-- Drop and recreate with SECURITY DEFINER to bypass RLS
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = false)  -- SECURITY DEFINER by default
AS
SELECT 
  id,
  username,
  avatar_url,
  invitation_code,
  created_at
FROM public.profiles;

-- Grant access to all users (view only exposes safe fields)
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Add comment for clarity
COMMENT ON VIEW public.public_profiles IS 
'Public view of user profiles with only safe fields. Uses SECURITY DEFINER to bypass RLS.';