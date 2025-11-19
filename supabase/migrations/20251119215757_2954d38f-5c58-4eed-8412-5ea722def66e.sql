-- Fix profiles RLS INSERT policy to allow trigger-based inserts
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (
    -- Allow insert if user is authenticated and inserting their own profile
    (auth.uid() = id) 
    OR 
    -- Allow insert from trigger context (when auth.uid() is NULL during signup)
    (auth.uid() IS NULL)
  );