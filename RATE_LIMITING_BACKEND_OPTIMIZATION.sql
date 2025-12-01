-- ============================================================================
-- RATE LIMITING SYSTEM — BACKEND OPTIMIZATION (v2.0)
-- ============================================================================
-- Date: 2025-12-01
-- Purpose: Optimize rate limiting for high concurrency and reduced table growth
--
-- CHANGES:
-- 1. Single row per (user_id, rpc_name) instead of per-window rows
-- 2. Window reset logic inside check_rate_limit RPC
-- 3. TRX-safe concurrent access with LOOP + INSERT/UPDATE retry
-- 4. Simplified cleanup (48-hour retention)
--
-- UNCHANGED:
-- - Rate limit values (AUTH/WALLET/GAME/SOCIAL/ADMIN)
-- - check_rate_limit API signature (p_rpc_name, p_max_calls, p_window_minutes) → BOOLEAN
-- - Fail-open behavior on errors
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 1: TABLE SCHEMA OPTIMIZATION
-- ────────────────────────────────────────────────────────────────────────────

-- 1.1. Remove old UNIQUE constraint on (user_id, rpc_name, window_start)
ALTER TABLE public.rpc_rate_limits
  DROP CONSTRAINT IF EXISTS rpc_rate_limits_user_rpc_window_unique;

-- 1.2. Add new UNIQUE constraint on (user_id, rpc_name) only
ALTER TABLE public.rpc_rate_limits
  ADD CONSTRAINT rpc_rate_limits_user_rpc_unique
  UNIQUE (user_id, rpc_name);

-- 1.3. Optimize index for single-row-per-user+rpc model
DROP INDEX IF EXISTS public.idx_rate_limits_lookup;

CREATE INDEX idx_rate_limits_lookup
  ON public.rpc_rate_limits(user_id, rpc_name);

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 2: CLEANUP OLD MULTI-ROW DATA (OPTIONAL PRE-MIGRATION)
-- ────────────────────────────────────────────────────────────────────────────

-- Keep only the most recent window_start row per (user_id, rpc_name)
-- This ensures UNIQUE constraint will succeed
DELETE FROM public.rpc_rate_limits
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id, rpc_name ORDER BY window_start DESC) as rn
    FROM public.rpc_rate_limits
  ) ranked
  WHERE rn = 1
);

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 3: OPTIMIZED check_rate_limit RPC FUNCTION (v2.0)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_rpc_name TEXT,
  p_max_calls INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_now          TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ;
  v_call_count   INTEGER;
BEGIN
  -- Fail-open if no authenticated user (allows anon endpoints to proceed)
  IF v_user_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Calculate window boundary: NOW - window_minutes
  v_window_start := v_now - make_interval(mins => p_window_minutes);

  /*
    LOGIC:
    - One row per (user_id, rpc_name) with UNIQUE constraint
    - If row's window_start < v_window_start → NEW WINDOW: reset call_count=1, window_start=NOW
    - If still within window → INCREMENT call_count
    - LOOP handles race condition on INSERT (unique_violation)
  */

  LOOP
    -- Attempt UPDATE on existing row
    UPDATE public.rpc_rate_limits
    SET
      call_count = CASE
        WHEN window_start < v_window_start THEN 1
        ELSE call_count + 1
      END,
      window_start = CASE
        WHEN window_start < v_window_start THEN v_now
        ELSE window_start
      END
    WHERE user_id = v_user_id
      AND rpc_name = p_rpc_name
    RETURNING call_count INTO v_call_count;

    -- If UPDATE succeeded, exit loop
    IF FOUND THEN
      EXIT;
    END IF;

    -- No row exists yet, attempt INSERT
    BEGIN
      INSERT INTO public.rpc_rate_limits (user_id, rpc_name, call_count, window_start)
      VALUES (v_user_id, p_rpc_name, 1, v_now)
      RETURNING call_count INTO v_call_count;
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        -- Concurrent INSERT won race, retry UPDATE in next LOOP iteration
        NULL;
    END;
  END LOOP;

  -- Rate limit check
  IF v_call_count > p_max_calls THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 4: OPTIONAL CLEANUP JOB (Simplified)
-- ────────────────────────────────────────────────────────────────────────────

-- Since we now have only 1 row per user+rpc, cleanup is much lighter
-- Delete rows that haven't been used in 48 hours (window_start is stale)
-- This can run daily or even be skipped entirely

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limit_windows()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.rpc_rate_limits
  WHERE window_start < NOW() - INTERVAL '48 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- VALIDATION QUERY: Verify single row per user+rpc
-- ────────────────────────────────────────────────────────────────────────────

-- Run this after migration to verify no duplicates exist:
-- SELECT user_id, rpc_name, COUNT(*) as row_count
-- FROM public.rpc_rate_limits
-- GROUP BY user_id, rpc_name
-- HAVING COUNT(*) > 1;
-- 
-- Expected result: 0 rows (all user+rpc pairs have exactly 1 row)

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
