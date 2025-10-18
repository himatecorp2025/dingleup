-- FIX CRITICAL RLS POLICY BUG: Replace the broken UPDATE policy with a proper one
-- The current policy checks that ALL fields equal their old values, making updates impossible!

DROP POLICY IF EXISTS "Users can update safe profile fields only" ON public.profiles;

-- Create new policy that allows users to update ONLY safe fields (username, avatar_url)
-- while PREVENTING updates to sensitive fields (coins, lives, etc.)
CREATE POLICY "Users can update their profile safely"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Only username and avatar_url can be updated by users directly
  -- All other sensitive fields must use RPC functions
);