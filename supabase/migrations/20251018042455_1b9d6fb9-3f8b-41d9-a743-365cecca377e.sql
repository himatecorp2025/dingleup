-- Fix Critical Security Issue #1: Remove overly permissive profile viewing policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Fix existing data: Ensure lives don't exceed max_lives
UPDATE profiles SET lives = max_lives WHERE lives > max_lives;

-- Fix Critical Security Issue #2: Add check constraints for coins and lives
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_coins_check,
  DROP CONSTRAINT IF EXISTS profiles_lives_check,
  ADD CONSTRAINT profiles_coins_check CHECK (coins >= 0 AND coins <= 1000000),
  ADD CONSTRAINT profiles_lives_check CHECK (lives >= 0 AND lives <= max_lives);

-- Add check constraint for game results to prevent score manipulation
ALTER TABLE game_results
  DROP CONSTRAINT IF EXISTS game_results_valid_score,
  DROP CONSTRAINT IF EXISTS game_results_valid_coins,
  DROP CONSTRAINT IF EXISTS game_results_valid_time,
  ADD CONSTRAINT game_results_valid_score CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
  ADD CONSTRAINT game_results_valid_coins CHECK (coins_earned >= 0 AND coins_earned <= 10000),
  ADD CONSTRAINT game_results_valid_time CHECK (average_response_time IS NULL OR average_response_time > 0);

-- Create secure function to award coins
CREATE OR REPLACE FUNCTION award_coins(amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF amount < 0 OR amount > 10000 THEN
    RAISE EXCEPTION 'Invalid coin amount';
  END IF;
  
  UPDATE profiles
  SET coins = LEAST(coins + amount, 1000000)
  WHERE id = auth.uid();
END;
$$;

-- Create secure function to spend coins
CREATE OR REPLACE FUNCTION spend_coins(amount INTEGER)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_coins INTEGER;
BEGIN
  SELECT coins INTO current_coins
  FROM profiles
  WHERE id = auth.uid();
  
  IF current_coins < amount THEN
    RETURN false;
  END IF;
  
  UPDATE profiles
  SET coins = coins - amount
  WHERE id = auth.uid();
  
  RETURN true;
END;
$$;

-- Create secure function to regenerate lives
CREATE OR REPLACE FUNCTION regenerate_lives()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  hours_passed NUMERIC;
  lives_to_add INTEGER;
BEGIN
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = auth.uid();
  
  hours_passed := EXTRACT(EPOCH FROM (NOW() - user_profile.last_life_regeneration)) / 3600;
  lives_to_add := FLOOR(hours_passed / user_profile.lives_regeneration_rate)::INTEGER;
  
  IF lives_to_add > 0 THEN
    UPDATE profiles
    SET 
      lives = LEAST(lives + lives_to_add, max_lives),
      last_life_regeneration = last_life_regeneration + (lives_to_add * lives_regeneration_rate * INTERVAL '1 hour')
    WHERE id = auth.uid();
  END IF;
END;
$$;

-- Create secure function to use a life
CREATE OR REPLACE FUNCTION use_life()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_lives INTEGER;
BEGIN
  PERFORM regenerate_lives();
  
  SELECT lives INTO current_lives
  FROM profiles
  WHERE id = auth.uid();
  
  IF current_lives < 1 THEN
    RETURN false;
  END IF;
  
  UPDATE profiles
  SET lives = lives - 1
  WHERE id = auth.uid();
  
  RETURN true;
END;
$$;

-- Update profiles RLS policy to prevent direct coin/lives manipulation
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  coins = (SELECT coins FROM profiles WHERE id = auth.uid()) AND
  lives = (SELECT lives FROM profiles WHERE id = auth.uid()) AND
  total_correct_answers = (SELECT total_correct_answers FROM profiles WHERE id = auth.uid())
);

-- Add email validation constraint to invitations
ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_valid_email,
  ADD CONSTRAINT invitations_valid_email CHECK (
    invited_email IS NULL OR 
    invited_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );