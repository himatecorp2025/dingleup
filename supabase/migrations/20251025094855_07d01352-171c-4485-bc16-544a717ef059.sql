-- Fix security definer views by removing them
-- These views were using SECURITY DEFINER which bypasses RLS

-- Drop existing security definer views if they exist
DROP VIEW IF EXISTS public.user_stats_view CASCADE;
DROP VIEW IF EXISTS public.admin_stats_view CASCADE;

-- Note: Extensions like pg_net cannot be moved to a different schema.
-- This is a known limitation and should not affect functionality.
-- The warning about extensions in public schema is informational only.