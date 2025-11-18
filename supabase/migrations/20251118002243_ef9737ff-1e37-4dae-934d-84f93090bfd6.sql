-- CRITICAL FIX: Ensure all users have weekly_rankings entry on registration
-- This fixes the issue where new users don't appear on leaderboard

-- Create function to initialize weekly_rankings for new users
CREATE OR REPLACE FUNCTION initialize_weekly_rankings_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start_date DATE;
BEGIN
  -- Calculate current week's Monday
  week_start_date := (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 1);
  
  -- Insert initial weekly_rankings entry for all categories
  INSERT INTO weekly_rankings (user_id, category, week_start, total_correct_answers, average_response_time)
  VALUES 
    (NEW.id, 'health', week_start_date, 0, 0),
    (NEW.id, 'history', week_start_date, 0, 0),
    (NEW.id, 'culture', week_start_date, 0, 0),
    (NEW.id, 'finance', week_start_date, 0, 0)
  ON CONFLICT (user_id, category, week_start) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to initialize weekly_rankings on profile creation
DROP TRIGGER IF EXISTS trigger_initialize_weekly_rankings ON profiles;
CREATE TRIGGER trigger_initialize_weekly_rankings
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_weekly_rankings_for_user();

-- Backfill existing users who don't have weekly_rankings entries
DO $$
DECLARE
  week_start_date DATE;
BEGIN
  -- Calculate current week's Monday
  week_start_date := (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 1);
  
  -- Insert missing entries for existing users
  INSERT INTO weekly_rankings (user_id, category, week_start, total_correct_answers, average_response_time)
  SELECT 
    p.id,
    c.category,
    week_start_date,
    0,
    0
  FROM profiles p
  CROSS JOIN (
    VALUES ('health'::text), ('history'::text), ('culture'::text), ('finance'::text)
  ) AS c(category)
  WHERE NOT EXISTS (
    SELECT 1 
    FROM weekly_rankings wr 
    WHERE wr.user_id = p.id 
      AND wr.category = c.category 
      AND wr.week_start = week_start_date
  );
END;
$$;