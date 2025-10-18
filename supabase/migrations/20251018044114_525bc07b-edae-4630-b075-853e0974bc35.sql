-- Fix RLS policies to prevent profile manipulation
-- Drop the existing overly permissive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new restrictive policy that only allows updating safe fields
CREATE POLICY "Users can update safe profile fields only"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent changing game economy fields
  coins = (SELECT coins FROM profiles WHERE id = auth.uid()) AND
  lives = (SELECT lives FROM profiles WHERE id = auth.uid()) AND
  total_correct_answers = (SELECT total_correct_answers FROM profiles WHERE id = auth.uid()) AND
  max_lives = (SELECT max_lives FROM profiles WHERE id = auth.uid()) AND
  lives_regeneration_rate = (SELECT lives_regeneration_rate FROM profiles WHERE id = auth.uid()) AND
  -- Prevent changing booster fields
  speed_booster_active = (SELECT speed_booster_active FROM profiles WHERE id = auth.uid()) AND
  speed_booster_expires_at = (SELECT speed_booster_expires_at FROM profiles WHERE id = auth.uid()) AND
  speed_booster_multiplier = (SELECT speed_booster_multiplier FROM profiles WHERE id = auth.uid()) AND
  -- Prevent changing help fields
  help_50_50_active = (SELECT help_50_50_active FROM profiles WHERE id = auth.uid()) AND
  help_2x_answer_active = (SELECT help_2x_answer_active FROM profiles WHERE id = auth.uid()) AND
  help_audience_active = (SELECT help_audience_active FROM profiles WHERE id = auth.uid()) AND
  -- Prevent changing gift/bonus fields
  daily_gift_streak = (SELECT daily_gift_streak FROM profiles WHERE id = auth.uid()) AND
  daily_gift_last_claimed = (SELECT daily_gift_last_claimed FROM profiles WHERE id = auth.uid()) AND
  welcome_bonus_claimed = (SELECT welcome_bonus_claimed FROM profiles WHERE id = auth.uid()) AND
  question_swaps_available = (SELECT question_swaps_available FROM profiles WHERE id = auth.uid()) AND
  invitation_code = (SELECT invitation_code FROM profiles WHERE id = auth.uid())
);

-- Create secure function for purchasing a life
CREATE OR REPLACE FUNCTION purchase_life()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_coins INTEGER;
  current_lives INTEGER;
  max_allowed_lives INTEGER;
  result json;
BEGIN
  SELECT coins, lives, max_lives INTO current_coins, current_lives, max_allowed_lives
  FROM profiles WHERE id = auth.uid();
  
  IF current_coins < 25 THEN
    RETURN json_build_object('success', false, 'error', 'Nincs elég aranyérméd');
  END IF;
  
  IF current_lives >= max_allowed_lives THEN
    RETURN json_build_object('success', false, 'error', 'Már maximális életed van');
  END IF;
  
  UPDATE profiles
  SET coins = coins - 25,
      lives = lives + 1
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true);
END;
$$;

-- Create secure function for activating boosters
CREATE OR REPLACE FUNCTION activate_booster(p_booster_type TEXT, p_cost INTEGER, p_multiplier INTEGER DEFAULT 2, p_duration_hours INTEGER DEFAULT 24)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_coins INTEGER;
  current_max_lives INTEGER;
  result json;
BEGIN
  SELECT coins, max_lives INTO current_coins, current_max_lives
  FROM profiles WHERE id = auth.uid();
  
  IF current_coins < p_cost THEN
    RETURN json_build_object('success', false, 'error', 'Nincs elég aranyérméd');
  END IF;
  
  IF p_booster_type = 'max_lives' THEN
    UPDATE profiles
    SET coins = coins - p_cost,
        max_lives = max_lives + 5,
        lives = LEAST(lives + 5, max_lives + 5)
    WHERE id = auth.uid();
    
    RETURN json_build_object('success', true);
  ELSIF p_booster_type = 'speed' THEN
    UPDATE profiles
    SET coins = coins - p_cost,
        speed_booster_active = true,
        speed_booster_expires_at = NOW() + (p_duration_hours || ' hours')::INTERVAL,
        speed_booster_multiplier = p_multiplier
    WHERE id = auth.uid();
    
    RETURN json_build_object('success', true);
  ELSE
    RETURN json_build_object('success', false, 'error', 'Érvénytelen booster típus');
  END IF;
END;
$$;

-- Create secure function for using helps
CREATE OR REPLACE FUNCTION use_help(p_help_type TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  help_available BOOLEAN;
  result json;
BEGIN
  IF p_help_type = '50_50' THEN
    SELECT help_50_50_active INTO help_available FROM profiles WHERE id = auth.uid();
    
    IF NOT help_available THEN
      RETURN json_build_object('success', false, 'error', 'Ez a segítség már nem elérhető');
    END IF;
    
    UPDATE profiles SET help_50_50_active = false WHERE id = auth.uid();
    RETURN json_build_object('success', true);
    
  ELSIF p_help_type = '2x_answer' THEN
    SELECT help_2x_answer_active INTO help_available FROM profiles WHERE id = auth.uid();
    
    IF NOT help_available THEN
      RETURN json_build_object('success', false, 'error', 'Ez a segítség már nem elérhető');
    END IF;
    
    UPDATE profiles SET help_2x_answer_active = false WHERE id = auth.uid();
    RETURN json_build_object('success', true);
    
  ELSIF p_help_type = 'audience' THEN
    SELECT help_audience_active INTO help_available FROM profiles WHERE id = auth.uid();
    
    IF NOT help_available THEN
      RETURN json_build_object('success', false, 'error', 'Ez a segítség már nem elérhető');
    END IF;
    
    UPDATE profiles SET help_audience_active = false WHERE id = auth.uid();
    RETURN json_build_object('success', true);
    
  ELSE
    RETURN json_build_object('success', false, 'error', 'Érvénytelen segítség típus');
  END IF;
END;
$$;

-- Create secure function for claiming daily gift
CREATE OR REPLACE FUNCTION claim_daily_gift()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_claimed TIMESTAMP WITH TIME ZONE;
  current_streak INTEGER;
  hours_since_last NUMERIC;
  reward_coins INTEGER;
  result json;
BEGIN
  SELECT daily_gift_last_claimed, daily_gift_streak 
  INTO last_claimed, current_streak
  FROM profiles WHERE id = auth.uid();
  
  -- Check if already claimed today
  IF last_claimed IS NOT NULL THEN
    hours_since_last := EXTRACT(EPOCH FROM (NOW() - last_claimed)) / 3600;
    
    IF hours_since_last < 20 THEN
      RETURN json_build_object('success', false, 'error', 'Már igényelted a mai ajándékot');
    END IF;
    
    -- Check if streak continues (claimed within 48 hours)
    IF hours_since_last > 48 THEN
      current_streak := 0;
    END IF;
  END IF;
  
  current_streak := current_streak + 1;
  reward_coins := LEAST(current_streak * 10, 100); -- Max 100 coins per day
  
  UPDATE profiles
  SET daily_gift_last_claimed = NOW(),
      daily_gift_streak = current_streak,
      coins = coins + reward_coins
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'coins', reward_coins, 'streak', current_streak);
END;
$$;

-- Create secure function for claiming welcome bonus
CREATE OR REPLACE FUNCTION claim_welcome_bonus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_claimed BOOLEAN;
BEGIN
  SELECT welcome_bonus_claimed INTO already_claimed
  FROM profiles WHERE id = auth.uid();
  
  IF already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted az üdvözlő bónuszt');
  END IF;
  
  UPDATE profiles
  SET welcome_bonus_claimed = true,
      coins = coins + 500
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'coins', 500);
END;
$$;

-- Improve invitation code generation with better randomness
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Use gen_random_bytes for cryptographically secure random
    new_code := upper(encode(gen_random_bytes(6), 'hex'));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE invitation_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Create function to regenerate invitation code
CREATE OR REPLACE FUNCTION regenerate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := generate_invitation_code();
  
  UPDATE profiles
  SET invitation_code = new_code
  WHERE id = auth.uid();
  
  RETURN new_code;
END;
$$;