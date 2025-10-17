-- Fix critical security issue: Block anonymous access to profiles table
-- This prevents email harvesting by unauthenticated users

-- Drop the existing overly permissive policy if it exists
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that only allows authenticated users to view profiles
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Keep the existing policies for users to manage their own data
-- (These should already exist, but we're not touching them)