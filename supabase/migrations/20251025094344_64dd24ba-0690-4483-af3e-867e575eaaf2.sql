-- SECURITY: Add secure rate limiting function
-- Prevents DDoS and abuse of RPC endpoints

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_rpc_name TEXT,
  p_max_calls INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_window_start timestamp with time zone;
  v_call_count integer;
BEGIN
  -- Calculate window start (floor to minute)
  v_window_start := date_trunc('minute', now()) - ((p_window_minutes - 1) || ' minutes')::interval;
  
  -- Get or create rate limit record
  INSERT INTO public.rpc_rate_limits (user_id, rpc_name, window_start, call_count)
  VALUES (v_user_id, p_rpc_name, v_window_start, 1)
  ON CONFLICT (user_id, rpc_name, window_start)
  DO UPDATE SET call_count = public.rpc_rate_limits.call_count + 1
  RETURNING call_count INTO v_call_count;
  
  -- Check if limit exceeded
  IF v_call_count > p_max_calls THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- SECURITY: Enhanced claim_welcome_bonus with rate limiting and server-side validation
-- This prevents localStorage manipulation and abuse

CREATE OR REPLACE FUNCTION public.claim_welcome_bonus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_claimed BOOLEAN;
  user_id uuid := auth.uid();
  credit_result json;
  v_attempt_count integer;
BEGIN
  -- SECURITY: Check rate limit (max 5 attempts per hour to prevent abuse)
  IF NOT check_rate_limit('claim_welcome_bonus', 5, 60) THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Túl sok próbálkozás. Kérjük, próbáld újra később.'
    );
  END IF;
  
  -- Track attempt (for security monitoring)
  INSERT INTO public.welcome_bonus_attempts (user_id, attempt_count, last_attempt_at)
  VALUES (user_id, 1, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    attempt_count = public.welcome_bonus_attempts.attempt_count + 1,
    last_attempt_at = now()
  RETURNING attempt_count INTO v_attempt_count;
  
  -- SECURITY: Check if attempt count is suspicious (>10 attempts = potential attack)
  IF v_attempt_count > 10 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Túl sok próbálkozás. Vedd fel a kapcsolatot az ügyfélszolgálattal.'
    );
  END IF;
  
  -- Check if already claimed in database (server-side, not localStorage!)
  SELECT welcome_bonus_claimed INTO already_claimed
  FROM profiles WHERE id = user_id;
  
  IF already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted az üdvözlő bónuszt');
  END IF;
  
  -- Use credit_wallet for idempotent operation
  SELECT credit_wallet(
    user_id,
    2500,  -- coins
    50,    -- lives
    'welcome',
    'welcome:' || user_id::text,
    '{"bonus_type": "welcome"}'::jsonb
  ) INTO credit_result;
  
  -- Check if credit was successful
  IF (credit_result->>'success')::boolean = false THEN
    RETURN credit_result;
  END IF;
  
  -- Mark as claimed (SERVER-SIDE, not localStorage!)
  UPDATE profiles
  SET welcome_bonus_claimed = true
  WHERE id = user_id;
  
  RETURN json_build_object('success', true, 'coins', 2500, 'lives', 50);
END;
$$;