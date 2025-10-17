-- Fix weekly_rankings RLS policies to prevent manipulation
-- Remove the overly permissive policy that allows all operations
DROP POLICY IF EXISTS "System can update weekly rankings" ON weekly_rankings;

-- Create proper policies for weekly_rankings
-- Users can only view rankings
CREATE POLICY "Users can view weekly rankings" 
ON weekly_rankings 
FOR SELECT 
TO authenticated
USING (true);

-- Only service role can insert/update/delete rankings (via edge functions)
CREATE POLICY "Service role can manage weekly rankings" 
ON weekly_rankings 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Add RLS policy comments for documentation
COMMENT ON POLICY "Users can view weekly rankings" ON weekly_rankings IS 'Authenticated users can view all weekly rankings for leaderboards';
COMMENT ON POLICY "Service role can manage weekly rankings" ON weekly_rankings IS 'Only automated systems (edge functions) can modify ranking data';