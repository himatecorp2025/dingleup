-- Fix security definer views by removing them
-- These views were using SECURITY DEFINER which bypasses RLS
DROP VIEW IF EXISTS public.user_stats_view CASCADE;
DROP VIEW IF EXISTS public.admin_stats_view CASCADE;

-- Move safe extensions from public to extensions schema
-- Skip pg_net and other system extensions that don't support SET SCHEMA
CREATE SCHEMA IF NOT EXISTS extensions;

-- Only move extensions that are safe to move (not pg_net or other immovable ones)
DO $$
DECLARE
  ext_name TEXT;
  ext_list TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get list of movable extensions in public schema
  SELECT array_agg(extname)
  INTO ext_list
  FROM pg_extension 
  WHERE extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND extname NOT IN ('pg_net', 'plpgsql', 'pgsodium', 'pgcrypto');
    
  -- Move each extension
  IF ext_list IS NOT NULL THEN
    FOREACH ext_name IN ARRAY ext_list
    LOOP
      BEGIN
        EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_name);
      EXCEPTION WHEN OTHERS THEN
        -- Skip extensions that can't be moved
        CONTINUE;
      END;
    END LOOP;
  END IF;
END $$;