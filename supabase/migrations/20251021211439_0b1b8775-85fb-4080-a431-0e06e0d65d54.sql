-- Clean up global_leaderboard table to only include users that actually exist in profiles
-- Delete all leaderboard entries that don't have a corresponding profile

DELETE FROM global_leaderboard 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Also clean up weekly_rankings for users that don't exist
DELETE FROM weekly_rankings 
WHERE user_id NOT IN (SELECT id FROM profiles);