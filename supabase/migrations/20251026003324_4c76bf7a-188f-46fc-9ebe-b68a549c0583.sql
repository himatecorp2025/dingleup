-- Fix infinite recursion in conversation_members RLS policies

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON conversation_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON conversation_members;

-- Create safe RLS policies without recursion
CREATE POLICY "Users can view their own memberships"
ON conversation_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships"
ON conversation_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own memberships"
ON conversation_members
FOR DELETE
USING (user_id = auth.uid());