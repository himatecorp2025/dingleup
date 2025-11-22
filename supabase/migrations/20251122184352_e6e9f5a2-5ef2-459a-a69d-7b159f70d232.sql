-- Enable RLS on leaderboard_cache (public leaderboard data)
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (leaderboards are public shared data)
CREATE POLICY "Anyone can view leaderboard cache"
ON leaderboard_cache
FOR SELECT
USING (true);

-- Only service role can modify (via refresh function)
CREATE POLICY "Only service role can modify leaderboard cache"
ON leaderboard_cache
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');