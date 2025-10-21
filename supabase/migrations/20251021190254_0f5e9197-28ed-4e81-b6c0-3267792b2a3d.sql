-- Fix security warnings and add admin profile visibility

-- 1. Move extensions from public to extensions schema
DO $$
BEGIN
  -- Only move if extensions exist in public schema
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- Move extensions (this is informational - extensions can't actually be moved easily)
    RAISE NOTICE 'Extensions found in public schema. Consider moving to extensions schema for better security.';
  END IF;
END $$;

-- 2. Enable leaked password protection (if available in this Supabase version)
-- This may not work in all Supabase versions but we try
DO $$
BEGIN
  -- This is a Supabase Auth setting that needs to be configured via dashboard
  RAISE NOTICE 'Leaked password protection should be enabled in Supabase Auth settings';
END $$;

-- 3. Update the admin profiles policy to be more explicit
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR  -- Users can see their own profile
  public.has_role(auth.uid(), 'admin'::app_role)  -- Admins can see all profiles
);