-- Cleanup old category system and ensure all users have 'mixed' category entry

-- Step 1: Delete all old category entries (health, history, culture, finance) from weekly_rankings
DELETE FROM weekly_rankings 
WHERE category IN ('health', 'history', 'culture', 'finance');

-- Step 2: Ensure every user has a 'mixed' category entry for current week
-- Calculate current week start (Monday)
DO $$
DECLARE
  current_week_start DATE;
BEGIN
  -- Calculate Monday of current week
  current_week_start := CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 6) % 7);
  
  -- Insert 'mixed' category entry for all users who don't have one yet
  INSERT INTO weekly_rankings (user_id, category, week_start, total_correct_answers, average_response_time, rank)
  SELECT 
    p.id as user_id,
    'mixed' as category,
    current_week_start as week_start,
    0 as total_correct_answers,
    0.00 as average_response_time,
    NULL as rank
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM weekly_rankings wr 
    WHERE wr.user_id = p.id 
    AND wr.category = 'mixed' 
    AND wr.week_start = current_week_start
  );
END $$;

-- Step 3: Create a trigger function to automatically create 'mixed' entry for new users
CREATE OR REPLACE FUNCTION ensure_mixed_weekly_ranking()
RETURNS TRIGGER AS $$
DECLARE
  current_week_start DATE;
BEGIN
  -- Calculate Monday of current week
  current_week_start := CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 6) % 7);
  
  -- Insert 'mixed' category entry for new user if it doesn't exist
  INSERT INTO weekly_rankings (user_id, category, week_start, total_correct_answers, average_response_time, rank)
  VALUES (NEW.id, 'mixed', current_week_start, 0, 0.00, NULL)
  ON CONFLICT (user_id, category, week_start) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Attach trigger to profiles table for new user registrations
DROP TRIGGER IF EXISTS ensure_mixed_ranking_on_user_create ON profiles;
CREATE TRIGGER ensure_mixed_ranking_on_user_create
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_mixed_weekly_ranking();