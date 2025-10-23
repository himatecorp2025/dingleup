
-- Fix critical security issues found by linter

-- 1. Fix public_profiles view: Change from SECURITY DEFINER to SECURITY INVOKER
-- This ensures the view uses the querying user's permissions instead of the view creator's
DROP VIEW IF EXISTS public.public_profiles;

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

-- 2. Enable RLS on weekly_prize_table
-- This table contains prize configuration and should be read-only for most users
ALTER TABLE public.weekly_prize_table ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view the prize table (read-only)
CREATE POLICY "Anyone can view prize table"
ON public.weekly_prize_table
FOR SELECT
TO public
USING (true);

-- Only service role can modify the prize table
CREATE POLICY "Service role can manage prize table"
ON public.weekly_prize_table
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
