-- Allow authenticated users to view public profile information
-- This enables user search, friend requests, and other social features
-- while keeping the existing restrictive policies for full profile access

CREATE POLICY "Users can view public profile info for search and social features"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);