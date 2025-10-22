-- Security Definer View probléma javítása
-- A public_profiles view nem lehet SECURITY DEFINER

DROP VIEW IF EXISTS public.public_profiles;

-- Létrehozzuk újra SECURITY INVOKER-ral (alapértelmezett)
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

-- RLS policy a VIEW-hoz
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Granted SELECT permission for authenticated users on the view
GRANT SELECT ON public.public_profiles TO authenticated;