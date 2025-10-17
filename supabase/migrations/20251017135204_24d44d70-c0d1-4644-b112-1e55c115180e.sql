-- Fix 1: Add username column to weekly_rankings for privacy
-- This prevents exposing user_id directly
ALTER TABLE weekly_rankings ADD COLUMN IF NOT EXISTS username TEXT;

-- Fix 2: Add UPDATE policy for invitations table
-- Allow invited users to accept their invitations
CREATE POLICY "Users can accept their invitations"
ON invitations
FOR UPDATE
TO authenticated
USING (auth.uid() = invited_user_id AND NOT accepted)
WITH CHECK (auth.uid() = invited_user_id AND accepted = true);