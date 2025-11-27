-- Create missing update_daily_ranking_for_user RPC function
-- This function updates daily rankings for a user after game completion
-- Called by complete-game edge function to update leaderboards in real-time

CREATE OR REPLACE FUNCTION public.update_daily_ranking_for_user(
  p_user_id UUID,
  p_correct_answers INTEGER,
  p_average_response_time NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_date DATE;
BEGIN
  v_day_date := get_current_day_date();
  
  -- Upsert daily rankings (aggregate all games played today)
  INSERT INTO public.daily_rankings (
    user_id,
    category,
    day_date,
    total_correct_answers,
    average_response_time
  )
  VALUES (
    p_user_id,
    'mixed',
    v_day_date,
    p_correct_answers,
    p_average_response_time
  )
  ON CONFLICT (user_id, category, day_date)
  DO UPDATE SET
    total_correct_answers = daily_rankings.total_correct_answers + EXCLUDED.total_correct_answers,
    average_response_time = (
      (daily_rankings.average_response_time * daily_rankings.total_correct_answers) + 
      (EXCLUDED.average_response_time * EXCLUDED.total_correct_answers)
    ) / NULLIF(daily_rankings.total_correct_answers + EXCLUDED.total_correct_answers, 0),
    updated_at = NOW();
    
  -- Recalculate ranks for all users on this day
  WITH ranked_users AS (
    SELECT 
      user_id, 
      category, 
      day_date, 
      ROW_NUMBER() OVER (
        PARTITION BY category, day_date 
        ORDER BY total_correct_answers DESC, average_response_time ASC
      ) as new_rank
    FROM public.daily_rankings 
    WHERE day_date = v_day_date AND category = 'mixed'
  )
  UPDATE public.daily_rankings dr 
  SET rank = ru.new_rank 
  FROM ranked_users ru 
  WHERE dr.user_id = ru.user_id 
    AND dr.category = ru.category 
    AND dr.day_date = ru.day_date;
END;
$$;