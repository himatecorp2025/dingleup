-- Fix welcome bonus to properly award coins and lives
-- The credit_wallet function is being called but we need to ensure it exists and works correctly

-- First, let's recreate the welcome bonus function with direct wallet updates
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_claimed BOOLEAN;
  user_id uuid := auth.uid();
  v_coins_before integer;
  v_lives_before integer;
BEGIN
  -- Check if already claimed
  SELECT welcome_bonus_claimed, coins, lives 
  INTO already_claimed, v_coins_before, v_lives_before
  FROM profiles 
  WHERE id = user_id;
  
  IF already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted az üdvözlő bónuszt');
  END IF;
  
  -- Award coins and lives directly
  UPDATE profiles
  SET 
    coins = coins + 2500,
    lives = lives + 50,
    welcome_bonus_claimed = true
  WHERE id = user_id;
  
  -- Record in wallet ledger for coins
  INSERT INTO wallet_ledger (user_id, delta_coins, source, correlation_id, metadata)
  VALUES (user_id, 2500, 'welcome', 'welcome:' || user_id::text, '{"bonus_type": "welcome"}'::jsonb);
  
  -- Record in lives ledger
  INSERT INTO lives_ledger (user_id, delta_lives, source, correlation_id, metadata)
  VALUES (user_id, 50, 'welcome', 'welcome:' || user_id::text, '{"bonus_type": "welcome"}'::jsonb);
  
  RETURN json_build_object('success', true, 'coins', 2500, 'lives', 50);
END;
$$;