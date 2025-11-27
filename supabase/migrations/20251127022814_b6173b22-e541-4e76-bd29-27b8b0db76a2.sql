-- CRITICAL FIX: Add FOR UPDATE row locking to credit_wallet to prevent race conditions
-- This ensures atomic wallet operations during high-concurrency scenarios

CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id uuid,
  p_delta_coins integer,
  p_delta_lives integer,
  p_source text,
  p_idempotency_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_current_coins integer;
  v_current_lives integer;
  v_max_lives integer;
  v_new_lives integer;
BEGIN
  -- Idempotency check FIRST (before locking)
  IF EXISTS (SELECT 1 FROM public.wallet_ledger WHERE idempotency_key = p_idempotency_key) THEN
    RETURN json_build_object('success', true, 'already_processed', true);
  END IF;

  -- CRITICAL: Add FOR UPDATE to lock the row and prevent race conditions
  SELECT coins, lives, max_lives 
  INTO v_current_coins, v_current_lives, v_max_lives
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;  -- Row-level lock for atomic operation

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Validate sufficient balance
  IF (v_current_coins + p_delta_coins) < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient coins');
  END IF;
  
  IF (v_current_lives + p_delta_lives) < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient lives');
  END IF;

  v_new_lives := v_current_lives + p_delta_lives;

  -- Insert ledger entry (idempotency enforced by unique constraint)
  INSERT INTO public.wallet_ledger (
    user_id, delta_coins, delta_lives, source, idempotency_key, metadata
  ) VALUES (
    p_user_id, p_delta_coins, p_delta_lives, p_source, p_idempotency_key, p_metadata
  );

  -- Update profile atomically
  UPDATE public.profiles
  SET 
    coins = coins + p_delta_coins,
    lives = v_new_lives,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'new_coins', v_current_coins + p_delta_coins,
    'new_lives', v_new_lives
  );
END;
$function$;

COMMENT ON FUNCTION public.credit_wallet IS 'Atomic idempotent wallet credit/debit with row-level locking for concurrency safety';