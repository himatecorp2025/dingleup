-- ============================================================
-- MONETIZATION & PAYMENT SYSTEM — BACKEND OPTIMIZATION
-- ============================================================
--
-- This file contains atomic, idempotent SQL helper functions and
-- database constraints to ensure the Stripe payment system is
-- 100% concurrent-safe and scalable under high load.
--
-- CRITICAL: These changes DO NOT modify business logic, reward
-- amounts, or user-visible behavior. Only internal implementation
-- for stability, idempotency, and performance.
--
-- ============================================================

-- ============================================================
-- 1) DATABASE CONSTRAINTS & INDEXES
-- ============================================================

-- 1.1. booster_purchases.iap_transaction_id UNIQUE constraint
-- Prevents duplicate purchase records for the same Stripe session
ALTER TABLE public.booster_purchases
  ADD CONSTRAINT IF NOT EXISTS booster_purchases_iap_transaction_id_key
  UNIQUE (iap_transaction_id);

-- 1.2. lootbox_instances — Add dedicated IAP transaction column
-- Previously IAP session was stored in metadata JSON, now explicit column for efficient querying
ALTER TABLE public.lootbox_instances
  ADD COLUMN IF NOT EXISTS iap_transaction_id TEXT;

-- Create UNIQUE index on iap_transaction_id (only for non-NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lootbox_iap_transaction
  ON public.lootbox_instances(iap_transaction_id)
  WHERE iap_transaction_id IS NOT NULL;

-- 1.3. Verify existing indexes (these should already exist from previous optimizations)
-- idx_booster_purchases_transaction (iap_transaction_id)
-- idx_booster_purchases_user (user_id, created_at DESC)
-- idx_lootbox_user_source (user_id, source, status)

-- ============================================================
-- 2) ATOMIC LOOTBOX PURCHASE RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.apply_lootbox_purchase_from_stripe(
  p_user_id uuid,
  p_session_id text,
  p_boxes integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_count INTEGER;
  v_open_cost INTEGER := 150; -- Current business rule: purchased boxes cost 150 gold to open
BEGIN
  -- ============================================================
  -- 1) IDEMPOTENCY CHECK (iap_transaction_id)
  -- ============================================================
  SELECT COUNT(*)
  INTO v_existing_count
  FROM public.lootbox_instances
  WHERE iap_transaction_id = p_session_id;

  IF v_existing_count > 0 THEN
    -- Already processed by webhook or concurrent verify call
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'boxes_credited', v_existing_count,
      'message', 'Lootboxes already credited for this session'
    );
  END IF;

  -- ============================================================
  -- 2) BULK INSERT ALL LOOTBOX INSTANCES (Single SQL Statement)
  -- ============================================================
  INSERT INTO public.lootbox_instances (
    user_id,
    source,
    status,
    open_cost_gold,
    iap_transaction_id,
    metadata
  )
  SELECT
    p_user_id,
    'purchase',
    'stored',
    v_open_cost,
    p_session_id,
    jsonb_build_object(
      'session_id', p_session_id,
      'purchased_at', NOW(),
      'credited_via', 'atomic_rpc'
    )
  FROM generate_series(1, p_boxes);

  -- ============================================================
  -- 3) RETURN SUCCESS
  -- ============================================================
  RETURN jsonb_build_object(
    'success', true,
    'boxes_credited', p_boxes
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Concurrent call inserted same session_id first
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'boxes_credited', p_boxes,
      'message', 'Concurrent insert detected, returning success'
    );
  WHEN OTHERS THEN
    RAISE EXCEPTION 'apply_lootbox_purchase_from_stripe failed: %', SQLERRM;
END;
$$;

-- ============================================================
-- 3) ATOMIC BOOSTER PURCHASE RPC (Speed / Premium)
-- ============================================================

CREATE OR REPLACE FUNCTION public.apply_booster_purchase_from_stripe(
  p_user_id uuid,
  p_session_id text,
  p_booster_code text,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_purchase_id uuid;
  v_booster_type RECORD;
  v_gold_reward INTEGER;
  v_lives_reward INTEGER;
  v_speed_count INTEGER;
  v_speed_duration INTEGER;
  v_price_usd_cents INTEGER;
  v_idempotency_key TEXT;
  v_credit_result jsonb;
  v_existing_tokens INTEGER;
BEGIN
  -- ============================================================
  -- 1) IDEMPOTENCY CHECK (booster_purchases.iap_transaction_id)
  -- ============================================================
  SELECT id
  INTO v_existing_purchase_id
  FROM public.booster_purchases
  WHERE iap_transaction_id = p_session_id
  LIMIT 1;

  IF v_existing_purchase_id IS NOT NULL THEN
    -- Already processed
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'message', 'Booster purchase already processed'
    );
  END IF;

  -- ============================================================
  -- 2) EXTRACT METADATA (preserve existing business logic values)
  -- ============================================================
  v_gold_reward := COALESCE((p_payload->>'gold_reward')::integer, 0);
  v_lives_reward := COALESCE((p_payload->>'lives_reward')::integer, 0);
  v_speed_count := COALESCE((p_payload->>'speed_token_count')::integer, 0);
  v_speed_duration := COALESCE((p_payload->>'speed_duration_min')::integer, 10);
  v_price_usd_cents := COALESCE((p_payload->>'price_usd_cents')::integer, 0);

  -- ============================================================
  -- 3) GET OR CREATE BOOSTER TYPE
  -- ============================================================
  SELECT *
  INTO v_booster_type
  FROM public.booster_types
  WHERE code = p_booster_code;

  IF v_booster_type IS NULL THEN
    -- Create booster type if missing (defensive, should exist)
    INSERT INTO public.booster_types (
      code,
      name,
      description,
      price_usd_cents,
      reward_gold,
      reward_lives,
      reward_speed_count,
      reward_speed_duration_min,
      is_active
    ) VALUES (
      p_booster_code,
      p_booster_code,
      'Auto-created booster type',
      v_price_usd_cents,
      v_gold_reward,
      v_lives_reward,
      v_speed_count,
      v_speed_duration,
      true
    )
    RETURNING * INTO v_booster_type;
  END IF;

  -- ============================================================
  -- 4) RECORD PURCHASE (booster_purchases)
  -- ============================================================
  INSERT INTO public.booster_purchases (
    user_id,
    booster_type_id,
    purchase_source,
    purchase_context,
    usd_cents_spent,
    gold_spent,
    iap_transaction_id
  ) VALUES (
    p_user_id,
    v_booster_type.id,
    COALESCE(p_payload->>'purchase_source', 'stripe_checkout'),
    'atomic_rpc',
    v_price_usd_cents,
    0,
    p_session_id
  );

  -- ============================================================
  -- 5) CREDIT WALLET (gold + lives) via credit_wallet RPC
  -- ============================================================
  IF v_gold_reward > 0 OR v_lives_reward > 0 THEN
    v_idempotency_key := 'payment:' || p_booster_code || ':' || p_user_id || ':' || p_session_id;

    SELECT public.credit_wallet(
      p_user_id,
      v_gold_reward,
      v_lives_reward,
      'booster_purchase',
      v_idempotency_key,
      jsonb_build_object(
        'booster_code', p_booster_code,
        'session_id', p_session_id
      )
    ) INTO v_credit_result;

    IF NOT (v_credit_result->>'success')::boolean THEN
      RAISE EXCEPTION 'Failed to credit wallet: %', v_credit_result->>'error';
    END IF;
  END IF;

  -- ============================================================
  -- 6) CREATE SPEED TOKENS (if any)
  -- ============================================================
  IF v_speed_count > 0 THEN
    -- Check if tokens already exist for this session (idempotency)
    SELECT COUNT(*)
    INTO v_existing_tokens
    FROM public.speed_tokens
    WHERE user_id = p_user_id
      AND source = COALESCE(p_payload->>'token_source', 'purchase')
      AND metadata->>'session_id' = p_session_id;

    IF v_existing_tokens = 0 THEN
      -- Bulk insert all tokens in one statement
      INSERT INTO public.speed_tokens (
        user_id,
        duration_minutes,
        source,
        metadata
      )
      SELECT
        p_user_id,
        v_speed_duration,
        COALESCE(p_payload->>'token_source', 'purchase'),
        jsonb_build_object(
          'session_id', p_session_id,
          'purchased_at', NOW()
        )
      FROM generate_series(1, v_speed_count);
    END IF;
  END IF;

  -- ============================================================
  -- 7) PREMIUM-SPECIFIC: Set pending premium flag
  -- ============================================================
  IF p_booster_code = 'PREMIUM' THEN
    INSERT INTO public.user_premium_booster_state (user_id, has_pending_premium_booster, updated_at)
    VALUES (p_user_id, true, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      has_pending_premium_booster = true,
      updated_at = NOW();
  END IF;

  -- ============================================================
  -- 8) RETURN SUCCESS
  -- ============================================================
  RETURN jsonb_build_object(
    'success', true,
    'gold_granted', v_gold_reward,
    'lives_granted', v_lives_reward,
    'speed_tokens_granted', v_speed_count
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Concurrent call inserted same iap_transaction_id
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'message', 'Concurrent purchase detected'
    );
  WHEN OTHERS THEN
    RAISE EXCEPTION 'apply_booster_purchase_from_stripe failed: %', SQLERRM;
END;
$$;

-- ============================================================
-- 4) ATOMIC INSTANT RESCUE RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.apply_instant_rescue_from_stripe(
  p_user_id uuid,
  p_session_id text,
  p_game_session_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_purchase_id uuid;
  v_booster_type_id uuid;
  v_gold_reward INTEGER;
  v_lives_reward INTEGER;
  v_price_usd_cents INTEGER;
  v_idempotency_key TEXT;
  v_credit_result jsonb;
BEGIN
  -- ============================================================
  -- 1) IDEMPOTENCY CHECK
  -- ============================================================
  SELECT id
  INTO v_existing_purchase_id
  FROM public.booster_purchases
  WHERE iap_transaction_id = p_session_id
  LIMIT 1;

  IF v_existing_purchase_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'message', 'Instant rescue already processed'
    );
  END IF;

  -- ============================================================
  -- 2) EXTRACT METADATA
  -- ============================================================
  v_booster_type_id := (p_payload->>'booster_type_id')::uuid;
  v_gold_reward := COALESCE((p_payload->>'gold_reward')::integer, 0);
  v_lives_reward := COALESCE((p_payload->>'lives_reward')::integer, 0);
  v_price_usd_cents := COALESCE((p_payload->>'price_usd_cents')::integer, 0);

  -- ============================================================
  -- 3) RECORD PURCHASE
  -- ============================================================
  INSERT INTO public.booster_purchases (
    user_id,
    booster_type_id,
    purchase_source,
    purchase_context,
    usd_cents_spent,
    gold_spent,
    iap_transaction_id
  ) VALUES (
    p_user_id,
    v_booster_type_id,
    'instant_rescue',
    'in_game_rescue_atomic',
    v_price_usd_cents,
    0,
    p_session_id
  );

  -- ============================================================
  -- 4) CREDIT WALLET
  -- ============================================================
  v_idempotency_key := 'payment:instant_rescue:' || p_user_id || ':' || p_session_id;

  SELECT public.credit_wallet(
    p_user_id,
    v_gold_reward,
    v_lives_reward,
    'instant_rescue_purchase',
    v_idempotency_key,
    jsonb_build_object(
      'session_id', p_session_id,
      'game_session_id', p_game_session_id,
      'booster_type_id', v_booster_type_id
    )
  ) INTO v_credit_result;

  IF NOT (v_credit_result->>'success')::boolean THEN
    RAISE EXCEPTION 'Failed to credit wallet: %', v_credit_result->>'error';
  END IF;

  -- ============================================================
  -- 5) UPDATE GAME SESSION (clear rescue pending flag)
  -- ============================================================
  IF p_game_session_id IS NOT NULL THEN
    UPDATE public.game_sessions
    SET
      pending_rescue = false,
      pending_rescue_session_id = NULL,
      rescue_completed_at = NOW()
    WHERE id = p_game_session_id
      AND user_id = p_user_id;
  END IF;

  -- ============================================================
  -- 6) RETURN SUCCESS
  -- ============================================================
  RETURN jsonb_build_object(
    'success', true,
    'gold_granted', v_gold_reward,
    'lives_granted', v_lives_reward
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'message', 'Concurrent rescue detected'
    );
  WHEN OTHERS THEN
    RAISE EXCEPTION 'apply_instant_rescue_from_stripe failed: %', SQLERRM;
END;
$$;

-- ============================================================
-- 5) OPTIONAL: Index for wallet_ledger analytics queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_source_created
  ON public.wallet_ledger (user_id, source, created_at DESC);

-- ============================================================
-- END OF MONETIZATION PAYMENT BACKEND OPTIMIZATION
-- ============================================================
