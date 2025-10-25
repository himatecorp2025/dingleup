-- Update RPC function to compute totals from game_results (historical), not profiles
CREATE OR REPLACE FUNCTION public.get_user_country_rank(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_country_code TEXT;
  v_user_total_correct INTEGER := 0;
  v_user_avg_response_time NUMERIC := 999999;
  v_rank INTEGER := 0;
BEGIN
  -- Resolve user's country
  SELECT country_code INTO v_user_country_code
  FROM public.profiles
  WHERE id = p_user_id;

  -- If no country, rank = 0 as requested
  IF NOT FOUND OR v_user_country_code IS NULL THEN
    RETURN 0;
  END IF;

  -- Compute user's historical total correct answers (completed games)
  SELECT COALESCE(SUM(gr.correct_answers), 0)
  INTO v_user_total_correct
  FROM public.game_results gr
  WHERE gr.user_id = p_user_id
    AND gr.completed = true;

  -- If user has 0 correct answers, rank = 0
  IF v_user_total_correct = 0 THEN
    RETURN 0;
  END IF;

  -- Compute user's average response time across completed games
  SELECT COALESCE(AVG(gr.average_response_time), 999999)
  INTO v_user_avg_response_time
  FROM public.game_results gr
  WHERE gr.user_id = p_user_id 
    AND gr.completed = true
    AND gr.average_response_time IS NOT NULL;

  -- Count competitors in same country with better stats
  -- Better = higher total_correct OR same total_correct but faster avg response
  WITH competitor_totals AS (
    SELECT p.id as user_id,
           COALESCE(SUM(gr.correct_answers), 0) AS total_correct,
           COALESCE(AVG(NULLIF(gr.average_response_time, NULL)), NULL) AS avg_time
    FROM public.profiles p
    LEFT JOIN public.game_results gr
      ON gr.user_id = p.id AND gr.completed = true
    WHERE p.country_code = v_user_country_code
      AND p.id <> p_user_id
    GROUP BY p.id
  )
  SELECT COUNT(*) + 1
  INTO v_rank
  FROM competitor_totals ct
  WHERE ct.total_correct >= 1
    AND (
      ct.total_correct > v_user_total_correct OR 
      (ct.total_correct = v_user_total_correct AND COALESCE(ct.avg_time, 999999) < v_user_avg_response_time)
    );

  RETURN v_rank;
END;
$$;

-- Ensure execute permission
GRANT EXECUTE ON FUNCTION public.get_user_country_rank(UUID) TO authenticated;