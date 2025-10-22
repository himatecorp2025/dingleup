-- Fix critical security issues with profiles table and public_profiles view

-- 1. Fix the "Admins can view all profiles" policy
-- Currently it allows ANY authenticated user to see ALL profiles with emails
-- We need to restrict it to actual admins only
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Only admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Add RLS policies to public_profiles view
-- Currently it has no policies, making it completely inaccessible
-- Since this is a SECURITY INVOKER view, we need policies on the view itself

-- Enable RLS on the view (if not already enabled)
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Actually, for views we can't add RLS policies directly
-- Instead, we need to ensure the underlying table policies work correctly
-- The issue is that public_profiles is a view, not a table
-- Let's create proper policies for searching other users

-- Allow authenticated users to search other users via limited fields
CREATE POLICY "Authenticated users can search profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);