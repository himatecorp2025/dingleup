-- Fix SECURITY DEFINER functions with search_path
-- This prevents privilege escalation attacks

-- 1. award_coins - Add search_path
CREATE OR REPLACE FUNCTION public.award_coins(amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF amount < 0 OR amount > 10000 THEN
    RAISE EXCEPTION 'Invalid coin amount';
  END IF;
  
  UPDATE profiles
  SET coins = LEAST(coins + amount, 1000000)
  WHERE id = auth.uid();
END;
$function$;

-- 2. spend_coins - Add search_path
CREATE OR REPLACE FUNCTION public.spend_coins(amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 3. regenerate_lives - Add search_path
CREATE OR REPLACE FUNCTION public.regenerate_lives()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 4. use_life - Add search_path
CREATE OR REPLACE FUNCTION public.use_life()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 5. purchase_life - Add search_path
CREATE OR REPLACE FUNCTION public.purchase_life()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 6. activate_booster - Add search_path
CREATE OR REPLACE FUNCTION public.activate_booster(p_booster_type text, p_cost integer, p_multiplier integer DEFAULT 2, p_duration_hours integer DEFAULT 24)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 7. use_help - Add search_path
CREATE OR REPLACE FUNCTION public.use_help(p_help_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 8. claim_welcome_bonus - Add search_path
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      coins = coins + 2500,
      lives = lives + 50
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'coins', 2500, 'lives', 50);
END;
$function$;

-- 9. regenerate_invitation_code - Add search_path
CREATE OR REPLACE FUNCTION public.regenerate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  new_code := '';
  FOR i IN 1..8 LOOP
    new_code := new_code || substring(chars from (floor(random() * length(chars)) + 1)::int for 1);
  END LOOP;
  
  UPDATE profiles
  SET invitation_code = new_code
  WHERE id = auth.uid();
  
  RETURN new_code;
END;
$function$;

-- 10. activate_speed_booster - Add search_path
CREATE OR REPLACE FUNCTION public.activate_speed_booster(booster_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booster RECORD;
  v_multiplier INTEGER;
  v_max_lives INTEGER;
  v_regen_rate_minutes NUMERIC;
  v_expires_at TIMESTAMPTZ := now() + interval '60 minutes';
BEGIN
  SELECT * INTO v_booster
  FROM public.user_boosters
  WHERE id = booster_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booster not found or not owned by user';
  END IF;

  IF v_booster.activated THEN
    RETURN true;
  END IF;

  CASE v_booster.booster_type
    WHEN 'DoubleSpeed' THEN 
      v_multiplier := 2; 
      v_max_lives := 25;
      v_regen_rate_minutes := 6;
    WHEN 'MegaSpeed' THEN 
      v_multiplier := 4; 
      v_max_lives := 35;
      v_regen_rate_minutes := 3;
    WHEN 'GigaSpeed' THEN 
      v_multiplier := 12; 
      v_max_lives := 75;
      v_regen_rate_minutes := 1;
    WHEN 'DingleSpeed' THEN 
      v_multiplier := 24; 
      v_max_lives := 135;
      v_regen_rate_minutes := 0.5;
    ELSE 
      RAISE EXCEPTION 'Unknown booster type: %', v_booster.booster_type;
  END CASE;

  UPDATE public.user_boosters
  SET activated = true,
      activated_at = now(),
      expires_at = v_expires_at
  WHERE id = booster_id AND user_id = auth.uid();

  UPDATE public.profiles
  SET speed_booster_active = true,
      speed_booster_expires_at = v_expires_at,
      speed_booster_multiplier = v_multiplier,
      max_lives = v_max_lives,
      lives_regeneration_rate = v_regen_rate_minutes,
      updated_at = now()
  WHERE id = auth.uid();

  RETURN true;
END;
$function$;

-- 11. regenerate_lives_background - Add search_path
CREATE OR REPLACE FUNCTION public.regenerate_lives_background()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  profile_rec RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC;
  effective_max_lives INTEGER;
BEGIN
  FOR profile_rec IN 
    SELECT * FROM profiles 
  LOOP
    IF profile_rec.speed_booster_active THEN
      IF profile_rec.speed_booster_expires_at > now() THEN
        CASE profile_rec.speed_booster_multiplier
          WHEN 2 THEN 
            regen_rate_minutes := 6;
            effective_max_lives := 25;
          WHEN 4 THEN 
            regen_rate_minutes := 3;
            effective_max_lives := 35;
          WHEN 12 THEN 
            regen_rate_minutes := 1;
            effective_max_lives := 75;
          WHEN 24 THEN 
            regen_rate_minutes := 0.5;
            effective_max_lives := 135;
          ELSE 
            regen_rate_minutes := 12;
            effective_max_lives := 15;
        END CASE;
      ELSE
        UPDATE profiles
        SET speed_booster_active = false,
            speed_booster_expires_at = null,
            speed_booster_multiplier = 1,
            max_lives = 15,
            lives_regeneration_rate = 12
        WHERE id = profile_rec.id;
        
        regen_rate_minutes := 12;
        effective_max_lives := 15;
      END IF;
    ELSE
      regen_rate_minutes := 12;
      effective_max_lives := 15;
    END IF;
    
    IF profile_rec.lives < effective_max_lives THEN
      minutes_passed := EXTRACT(EPOCH FROM (NOW() - profile_rec.last_life_regeneration)) / 60;
      lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
      
      IF lives_to_add > 0 THEN
        UPDATE profiles
        SET 
          lives = LEAST(lives + lives_to_add, effective_max_lives),
          last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
        WHERE id = profile_rec.id;
      END IF;
    END IF;
  END LOOP;
END;
$function$;

-- 12. reactivate_help - Add search_path
CREATE OR REPLACE FUNCTION public.reactivate_help(p_help_type text, p_cost integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_coins INTEGER;
  flag BOOLEAN;
BEGIN
  SELECT coins INTO current_coins FROM profiles WHERE id = auth.uid();
  IF current_coins < p_cost THEN
    RETURN json_build_object('success', false, 'error', 'Nincs elég aranyérméd');
  END IF;

  IF p_help_type = '50_50' THEN
    SELECT help_50_50_active INTO flag FROM profiles WHERE id = auth.uid();
    IF flag THEN RETURN json_build_object('success', false, 'error', 'Már aktív'); END IF;
    UPDATE profiles SET help_50_50_active = true, coins = coins - p_cost WHERE id = auth.uid();
  ELSIF p_help_type = '2x_answer' THEN
    SELECT help_2x_answer_active INTO flag FROM profiles WHERE id = auth.uid();
    IF flag THEN RETURN json_build_object('success', false, 'error', 'Már aktív'); END IF;
    UPDATE profiles SET help_2x_answer_active = true, coins = coins - p_cost WHERE id = auth.uid();
  ELSIF p_help_type = 'audience' THEN
    SELECT help_audience_active INTO flag FROM profiles WHERE id = auth.uid();
    IF flag THEN RETURN json_build_object('success', false, 'error', 'Már aktív'); END IF;
    UPDATE profiles SET help_audience_active = true, coins = coins - p_cost WHERE id = auth.uid();
  ELSE
    RETURN json_build_object('success', false, 'error', 'Érvénytelen segítség típus');
  END IF;

  RETURN json_build_object('success', true);
END;
$function$;

-- 13. get_invitation_tier_reward - Add search_path
CREATE OR REPLACE FUNCTION public.get_invitation_tier_reward(accepted_count integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  CASE
    WHEN accepted_count = 1 OR accepted_count = 2 THEN
      RETURN json_build_object('coins', 200, 'lives', 3);
    WHEN accepted_count >= 3 AND accepted_count <= 9 THEN
      RETURN json_build_object('coins', 1000, 'lives', 5);
    WHEN accepted_count >= 10 THEN
      RETURN json_build_object('coins', 6000, 'lives', 20);
    ELSE
      RETURN json_build_object('coins', 0, 'lives', 0);
  END CASE;
END;
$function$;

-- 14. generate_invitation_code - Add search_path
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  LOOP
    new_code := '';
    FOR i IN 1..8 LOOP
      new_code := new_code || substring(chars from (floor(random() * length(chars)) + 1)::int for 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM profiles WHERE invitation_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$function$;

-- 15. mark_users_offline - Add search_path
CREATE OR REPLACE FUNCTION public.mark_users_offline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE user_presence
  SET is_online = false
  WHERE last_seen < NOW() - INTERVAL '5 minutes'
  AND is_online = true;
END;
$function$;

-- 16. set_message_retention - Add search_path
CREATE OR REPLACE FUNCTION public.set_message_retention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.retention_until := NEW.created_at + INTERVAL '90 days';
  RETURN NEW;
END;
$function$;

-- 17. extend_reported_message_retention - Add search_path
CREATE OR REPLACE FUNCTION public.extend_reported_message_retention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.report_type = 'user_behavior' AND NEW.reported_message_id IS NOT NULL THEN
    UPDATE messages
    SET is_reported = true,
        retention_until = NOW() + INTERVAL '5 years'
    WHERE id = NEW.reported_message_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 18. cleanup_old_messages - Add search_path
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM messages
  WHERE retention_until < NOW();
END;
$function$;

-- 19. process_invitation_reward - Add search_path
CREATE OR REPLACE FUNCTION public.process_invitation_reward()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  accepted_count INT;
  reward JSON;
  coins_reward INT;
  lives_reward INT;
BEGIN
  SELECT COUNT(*) INTO accepted_count
  FROM invitations
  WHERE inviter_id = auth.uid() AND accepted = true;
  
  reward := get_invitation_tier_reward(accepted_count);
  coins_reward := (reward->>'coins')::INT;
  lives_reward := (reward->>'lives')::INT;
  
  UPDATE profiles
  SET 
    coins = coins + coins_reward,
    lives = LEAST(lives + lives_reward, max_lives + lives_reward)
  WHERE id = auth.uid();
  
  RETURN json_build_object(
    'success', true, 
    'coins', coins_reward, 
    'lives', lives_reward,
    'total_accepted', accepted_count
  );
END;
$function$;

-- 20. claim_daily_gift - Add search_path
CREATE OR REPLACE FUNCTION public.claim_daily_gift()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  last_claimed TIMESTAMP WITH TIME ZONE;
  current_streak INTEGER;
  new_streak INTEGER;
  reward_coins INTEGER;
  reward_amounts INTEGER[] := ARRAY[50, 75, 110, 160, 220, 300, 500];
  today DATE := CURRENT_DATE;
BEGIN
  SELECT daily_gift_last_claimed, daily_gift_streak
  INTO last_claimed, current_streak
  FROM profiles WHERE id = auth.uid();
  
  IF last_claimed IS NOT NULL AND DATE(last_claimed) = today THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted a mai ajándékot');
  END IF;
  
  IF last_claimed IS NULL OR date_trunc('week', today::timestamp) > date_trunc('week', last_claimed) THEN
    current_streak := 0;
  END IF;
  
  new_streak := (COALESCE(current_streak, 0) % 7) + 1;
  reward_coins := reward_amounts[new_streak];
  
  UPDATE profiles
  SET daily_gift_last_claimed = NOW(),
      daily_gift_streak = new_streak,
      coins = coins + reward_coins
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'coins', reward_coins, 'streak', new_streak);
END;
$function$;

-- 21. distribute_weekly_rewards - Add search_path
CREATE OR REPLACE FUNCTION public.distribute_weekly_rewards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  week_start DATE;
  reward_record RECORD;
  reward_coins INTEGER;
  reward_lives INTEGER;
BEGIN
  week_start := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 6;
  
  FOR reward_record IN
    SELECT 
      user_id,
      rank,
      category
    FROM weekly_rankings
    WHERE week_start = week_start
      AND rank <= 10
    ORDER BY category, rank
  LOOP
    CASE reward_record.rank
      WHEN 1 THEN reward_coins := 5000; reward_lives := 100;
      WHEN 2 THEN reward_coins := 2500; reward_lives := 50;
      WHEN 3 THEN reward_coins := 1500; reward_lives := 30;
      WHEN 4 THEN reward_coins := 1000; reward_lives := 20;
      WHEN 5 THEN reward_coins := 800; reward_lives := 15;
      WHEN 6 THEN reward_coins := 700; reward_lives := 10;
      WHEN 7 THEN reward_coins := 600; reward_lives := 10;
      WHEN 8 THEN reward_coins := 500; reward_lives := 8;
      WHEN 9 THEN reward_coins := 500; reward_lives := 6;
      WHEN 10 THEN reward_coins := 500; reward_lives := 5;
      ELSE CONTINUE;
    END CASE;
    
    UPDATE profiles
    SET 
      coins = coins + reward_coins,
      lives = LEAST(lives + reward_lives, max_lives + reward_lives)
    WHERE id = reward_record.user_id;
  END LOOP;
END;
$function$;

-- 22. reset_game_helps - Add search_path
CREATE OR REPLACE FUNCTION public.reset_game_helps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles
  SET 
    help_50_50_active = true,
    help_2x_answer_active = true,
    help_audience_active = true
  WHERE id = auth.uid();
END;
$function$;

-- 23. create_friendship_from_invitation - Add search_path
CREATE OR REPLACE FUNCTION public.create_friendship_from_invitation(p_inviter_id uuid, p_invitee_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  normalized_ids UUID[];
  v_friendship_id UUID;
  v_thread_id UUID;
BEGIN
  normalized_ids := normalize_user_ids(p_inviter_id, p_invitee_id);
  
  INSERT INTO public.friendships (user_id_a, user_id_b, status)
  VALUES (normalized_ids[1], normalized_ids[2], 'active')
  ON CONFLICT (user_id_a, user_id_b) 
  DO UPDATE SET status = 'active', updated_at = now()
  RETURNING id INTO v_friendship_id;
  
  INSERT INTO public.dm_threads (user_id_a, user_id_b)
  VALUES (normalized_ids[1], normalized_ids[2])
  ON CONFLICT (user_id_a, user_id_b) 
  DO NOTHING
  RETURNING id INTO v_thread_id;
  
  IF v_thread_id IS NULL THEN
    SELECT id INTO v_thread_id FROM public.dm_threads
    WHERE user_id_a = normalized_ids[1] AND user_id_b = normalized_ids[2];
  END IF;
  
  INSERT INTO public.message_reads (thread_id, user_id, last_read_at)
  VALUES 
    (v_thread_id, p_inviter_id, now()),
    (v_thread_id, p_invitee_id, now())
  ON CONFLICT (thread_id, user_id) DO NOTHING;
  
  RETURN json_build_object(
    'success', true,
    'friendship_id', v_friendship_id,
    'thread_id', v_thread_id
  );
END;
$function$;

-- 24. update_updated_at_column - Add search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 25. accept_invitation - Add search_path
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_code_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inviter_user_id uuid;
  invitation_record record;
  accepted_count int;
  reward_coins int;
  reward_lives int;
BEGIN
  SELECT * INTO invitation_record
  FROM invitations
  WHERE invitation_code = invitation_code_input
    AND invited_user_id = auth.uid()
    AND accepted = false
  LIMIT 1;

  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or already accepted invitation');
  END IF;

  inviter_user_id := invitation_record.inviter_id;

  UPDATE invitations
  SET accepted = true,
      accepted_at = now()
  WHERE id = invitation_record.id;

  SELECT COUNT(*) INTO accepted_count
  FROM invitations
  WHERE inviter_id = inviter_user_id
    AND accepted = true;

  IF accepted_count >= 1 AND accepted_count <= 2 THEN
    reward_coins := 200;
    reward_lives := 3;
  ELSIF accepted_count >= 3 AND accepted_count <= 9 THEN
    reward_coins := 1000;
    reward_lives := 5;
  ELSIF accepted_count >= 10 THEN
    reward_coins := 6000;
    reward_lives := 20;
  ELSE
    reward_coins := 0;
    reward_lives := 0;
  END IF;

  IF reward_coins > 0 THEN
    UPDATE profiles
    SET coins = GREATEST(0, coins + reward_coins),
        lives = LEAST(max_lives, lives + reward_lives)
    WHERE id = inviter_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'inviter_id', inviter_user_id,
    'reward_coins', reward_coins,
    'reward_lives', reward_lives,
    'total_accepted', accepted_count
  );
END;
$function$;

-- 26. set_invitation_code - Add search_path
CREATE OR REPLACE FUNCTION public.set_invitation_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.invitation_code IS NULL THEN
    NEW.invitation_code := generate_invitation_code();
  END IF;
  RETURN NEW;
END;
$function$;

-- 27. handle_new_user - Add search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, email, invitation_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    generate_invitation_code()
  );
  RETURN NEW;
END;
$function$;

-- Add DELETE RLS policy for user_presence table
CREATE POLICY "Users can delete their own presence"
ON public.user_presence
FOR DELETE
USING (auth.uid() = user_id);