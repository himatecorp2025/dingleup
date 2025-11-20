-- Fix SECURITY DEFINER functions missing SET search_path
-- Critical SQL Injection Prevention - fixes 5 functions identified by Supabase linter

-- 1. Fix sync_question_like_count - Add SET search_path
CREATE OR REPLACE FUNCTION public.sync_question_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.questions
    SET like_count = like_count + 1
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.questions
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 2. Fix sync_question_dislike_count - Add SET search_path
CREATE OR REPLACE FUNCTION public.sync_question_dislike_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.questions
    SET dislike_count = dislike_count + 1
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.questions
    SET dislike_count = GREATEST(0, dislike_count - 1)
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 3. Fix ensure_mixed_weekly_ranking - Add SET search_path
CREATE OR REPLACE FUNCTION public.ensure_mixed_weekly_ranking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- 4. Fix handle_new_user - Add SET search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert new profile with data from auth metadata
  INSERT INTO public.profiles (
    id,
    username,
    email,
    birth_date,
    country_code,
    coins,
    lives,
    max_lives,
    lives_regeneration_rate,
    last_life_regeneration,
    help_third_active,
    help_2x_answer_active,
    help_audience_active,
    daily_gift_streak,
    welcome_bonus_claimed,
    question_swaps_available,
    total_correct_answers
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'birthDate')::date, '1991-05-05'::date),
    'HU', -- Default to Hungary, will be updated by geolocation function
    0,    -- coins
    15,   -- lives
    15,   -- max_lives
    12,   -- lives_regeneration_rate (minutes)
    NOW(), -- last_life_regeneration
    true, -- help_third_active
    true, -- help_2x_answer_active
    true, -- help_audience_active
    0,    -- daily_gift_streak
    false, -- welcome_bonus_claimed
    0,    -- question_swaps_available
    0     -- total_correct_answers
  );
  RETURN NEW;
END;
$$;