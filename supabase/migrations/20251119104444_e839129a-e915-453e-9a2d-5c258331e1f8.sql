-- Enable public viewing of basic profile information for leaderboard
-- This policy allows all authenticated users to see basic profile info (username, avatar, country) of other users
-- Required for country-specific leaderboards to work

CREATE POLICY "Users can view public profile data of all users"
ON profiles
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Users can view public profile data of all users" ON profiles IS 
'Allows authenticated users to see basic public profile information (username, avatar_url, country_code) of all users. Required for leaderboards and social features.';