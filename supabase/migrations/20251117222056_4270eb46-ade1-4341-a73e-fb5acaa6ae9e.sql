-- Drop existing restrictive policies on weekly_rankings
DROP POLICY IF EXISTS "Owners and admins view full leaderboard" ON weekly_rankings;
DROP POLICY IF EXISTS "Users can insert own leaderboard stats" ON weekly_rankings;
DROP POLICY IF EXISTS "Users can update own leaderboard stats" ON weekly_rankings;

-- Create new policies for weekly_rankings: everyone can see all rankings
CREATE POLICY "Anyone can view weekly rankings"
ON weekly_rankings
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage weekly rankings"
ON weekly_rankings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Drop existing restrictive policies on global_leaderboard
DROP POLICY IF EXISTS "Owners and admins view full leaderboard" ON global_leaderboard;
DROP POLICY IF EXISTS "Users can insert own leaderboard stats" ON global_leaderboard;
DROP POLICY IF EXISTS "Users can update own leaderboard stats" ON global_leaderboard;

-- Create new policies for global_leaderboard: everyone can see all rankings
CREATE POLICY "Anyone can view global leaderboard"
ON global_leaderboard
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage global leaderboard"
ON global_leaderboard
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');