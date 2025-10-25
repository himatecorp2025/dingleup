-- Add country_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON public.profiles(country_code);

-- Create RPC function to calculate user's country-specific rank
CREATE OR REPLACE FUNCTION public.get_user_country_rank(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_country_code TEXT;
  v_user_total_correct INTEGER;
  v_user_avg_response_time NUMERIC;
  v_rank INTEGER;
BEGIN
  -- Get user's country code and total correct answers
  SELECT country_code, total_correct_answers
  INTO v_user_country_code, v_user_total_correct
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- If user not found or no country code, return 0
  IF NOT FOUND OR v_user_country_code IS NULL THEN
    RETURN 0;
  END IF;
  
  -- If user has 0 correct answers, return 0
  IF v_user_total_correct = 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate user's average response time from game_results
  SELECT COALESCE(AVG(average_response_time), 999999)
  INTO v_user_avg_response_time
  FROM public.game_results
  WHERE user_id = p_user_id 
    AND completed = true
    AND average_response_time IS NOT NULL;
  
  -- Count how many users in the same country have better stats
  -- Better = more correct answers OR (same correct answers AND faster response time)
  SELECT COUNT(*) + 1
  INTO v_rank
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT COALESCE(AVG(gr.average_response_time), 999999) as avg_time
    FROM public.game_results gr
    WHERE gr.user_id = p.id 
      AND gr.completed = true
      AND gr.average_response_time IS NOT NULL
  ) user_stats ON true
  WHERE p.country_code = v_user_country_code
    AND p.id != p_user_id
    AND p.total_correct_answers >= 1
    AND (
      p.total_correct_answers > v_user_total_correct
      OR (
        p.total_correct_answers = v_user_total_correct 
        AND user_stats.avg_time < v_user_avg_response_time
      )
    );
  
  RETURN v_rank;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_country_rank(UUID) TO authenticated;