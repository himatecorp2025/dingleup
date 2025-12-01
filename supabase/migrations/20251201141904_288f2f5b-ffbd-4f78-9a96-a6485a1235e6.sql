-- Create atomic forgot-pin RPC function with row-level locking for high-load safety
-- This function prevents race conditions when multiple forgot-pin requests come for the same user
CREATE OR REPLACE FUNCTION public.forgot_pin_atomic(
  p_username TEXT,
  p_recovery_code_hash TEXT,
  p_new_pin TEXT,
  p_now TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_attempts INTEGER;
  v_last_attempt TIMESTAMPTZ;
  v_one_hour_ago TIMESTAMPTZ;
  v_new_pin_hash TEXT;
  v_new_recovery_code TEXT;
  v_new_recovery_code_hash TEXT;
BEGIN
  -- ATOMIC OPERATION: Lock user row for entire transaction to prevent concurrent modifications
  SELECT id, username, recovery_code_hash, pin_reset_attempts, pin_reset_last_attempt_at
  INTO v_user
  FROM public.profiles
  WHERE LOWER(username) = LOWER(p_username)
  FOR UPDATE;  -- Row-level lock prevents concurrent forgot-pin requests

  -- User not found (generic error for security)
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', 'Érvénytelen felhasználónév vagy helyreállítási kód',
      'error_code', 'USER_NOT_FOUND'
    );
  END IF;

  -- Rate limiting: check attempts and timing
  v_attempts := COALESCE(v_user.pin_reset_attempts, 0);
  v_last_attempt := v_user.pin_reset_last_attempt_at;
  v_one_hour_ago := p_now - INTERVAL '1 hour';

  -- Reset counter if last attempt was more than 1 hour ago
  IF v_last_attempt IS NOT NULL AND v_last_attempt < v_one_hour_ago THEN
    v_attempts := 0;
  END IF;

  -- Check rate limit (max 5 attempts per hour)
  IF v_attempts >= 5 THEN
    RETURN jsonb_build_object(
      'error', 'Túl sok sikertelen próbálkozás. Kérlek próbáld újra 1 óra múlva.',
      'error_code', 'RATE_LIMIT_EXCEEDED'
    );
  END IF;

  -- Validate recovery code hash
  IF p_recovery_code_hash != v_user.recovery_code_hash THEN
    -- Increment failed attempts counter
    UPDATE public.profiles
    SET 
      pin_reset_attempts = v_attempts + 1,
      pin_reset_last_attempt_at = p_now
    WHERE id = v_user.id;

    RETURN jsonb_build_object(
      'error', 'A megadott helyreállítási kód érvénytelen',
      'error_code', 'INVALID_RECOVERY_CODE'
    );
  END IF;

  -- Recovery code valid: Generate new PIN hash and recovery code
  -- Hash new PIN using SHA-256
  v_new_pin_hash := encode(digest(p_new_pin, 'sha256'), 'hex');

  -- Generate new recovery code (format: XXXX-XXXX-XXXX)
  v_new_recovery_code := (
    SELECT string_agg(
      substring('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' FROM (random() * 35 + 1)::int FOR 1),
      CASE WHEN i % 4 = 0 THEN '-' ELSE '' END
    )
    FROM generate_series(1, 12) i
  );
  -- Remove trailing dash if any
  v_new_recovery_code := regexp_replace(v_new_recovery_code, '-$', '');

  -- Hash new recovery code
  v_new_recovery_code_hash := encode(digest(v_new_recovery_code, 'sha256'), 'hex');

  -- ATOMIC UPDATE: Update all fields in single transaction
  UPDATE public.profiles
  SET
    pin_hash = v_new_pin_hash,
    recovery_code_hash = v_new_recovery_code_hash,
    recovery_code_set_at = p_now,
    pin_reset_attempts = 0,
    pin_reset_last_attempt_at = NULL
  WHERE id = v_user.id;

  -- Return success with user info and new recovery code
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'username', v_user.username,
    'new_recovery_code', v_new_recovery_code
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.forgot_pin_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.forgot_pin_atomic TO service_role;