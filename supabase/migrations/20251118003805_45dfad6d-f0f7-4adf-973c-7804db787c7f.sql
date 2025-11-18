-- CRITICAL FIX: Force backfill all existing users to current week's rankings
-- This ensures everyone appears on the leaderboard

DO $$
DECLARE
  week_start_date DATE;
  inserted_count INTEGER;
BEGIN
  -- Calculate current week's Monday (same logic as frontend)
  week_start_date := (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 1)::date;
  
  RAISE NOTICE 'Backfilling weekly_rankings for week starting: %', week_start_date;
  
  -- Delete and re-insert to ensure clean state
  DELETE FROM weekly_rankings WHERE week_start = week_start_date;
  
  -- Insert all users with all categories for current week
  INSERT INTO weekly_rankings (user_id, category, week_start, total_correct_answers, average_response_time)
  SELECT 
    p.id as user_id,
    c.category,
    week_start_date,
    COALESCE(gr.total_correct, 0) as total_correct_answers,
    COALESCE(gr.avg_response_time, 0) as average_response_time
  FROM profiles p
  CROSS JOIN (
    VALUES ('health'::text), ('history'::text), ('culture'::text), ('finance'::text)
  ) AS c(category)
  LEFT JOIN (
    SELECT 
      user_id,
      category,
      SUM(correct_answers) as total_correct,
      AVG(average_response_time) as avg_response_time
    FROM game_results
    WHERE created_at >= week_start_date
    GROUP BY user_id, category
  ) gr ON gr.user_id = p.id AND gr.category = c.category;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % rows into weekly_rankings', inserted_count;
END;
$$;