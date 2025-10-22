-- Fix the profiles table security issue
-- The current "Users can search other profiles with limited fields" policy
-- doesn't actually limit columns, it only limits rows.
-- We need to remove it and ensure users can only search via public_profiles view.

-- Drop the problematic policy that exposes all profile data
DROP POLICY IF EXISTS "Users can search other profiles with limited fields" ON public.profiles;

-- Ensure public_profiles view exists with only safe columns
DROP VIEW IF EXISTS public.public_profiles CASCADE;
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  avatar_url,
  invitation_code,
  created_at
FROM public.profiles;

-- Anyone can search public profiles (via the view, not the table)
-- This is safe because the view only exposes non-sensitive columns
GRANT SELECT ON public.public_profiles TO authenticated, anon;