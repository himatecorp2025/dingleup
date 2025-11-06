-- Fix welcome bonus RPC to ensure it works correctly
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  already_claimed BOOLEAN;
  user_id uuid := auth.uid();
  v_coins_before integer;
  v_lives_before integer;
  v_max_lives integer;
BEGIN
  -- Check if user exists and get current values
  SELECT welcome_bonus_claimed, coins, lives, max_lives
  INTO already_claimed, v_coins_before, v_lives_before, v_max_lives
  FROM profiles 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Felhasználó nem található');
  END IF;
  
  IF already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted az üdvözlő bónuszt');
  END IF;
  
  -- Award coins and lives directly (transactionally)
  UPDATE profiles
  SET 
    coins = coins + 2500,
    lives = LEAST(lives + 50, max_lives + 50), -- Allow lives to exceed max temporarily
    welcome_bonus_claimed = true,
    updated_at = now()
  WHERE id = user_id;
  
  -- Record in wallet ledger for coins
  INSERT INTO wallet_ledger (user_id, delta_coins, delta_lives, source, idempotency_key, metadata)
  VALUES (user_id, 2500, 0, 'welcome', 'welcome_coins:' || user_id::text, jsonb_build_object('bonus_type', 'welcome'));
  
  -- Record in lives ledger
  INSERT INTO lives_ledger (user_id, delta_lives, source, correlation_id, metadata)
  VALUES (user_id, 50, 'welcome', 'welcome_lives:' || user_id::text, jsonb_build_object('bonus_type', 'welcome'));
  
  RETURN json_build_object(
    'success', true, 
    'coins', 2500, 
    'lives', 50,
    'new_coins', v_coins_before + 2500,
    'new_lives', LEAST(v_lives_before + 50, v_max_lives + 50)
  );
END;
$function$;