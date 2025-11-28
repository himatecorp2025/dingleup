-- Update open_lootbox_transaction to support free opening for purchased lootboxes
-- Adds p_open_cost parameter: 0 for purchased lootboxes, 150 for drops

CREATE OR REPLACE FUNCTION public.open_lootbox_transaction(
  p_lootbox_id UUID,
  p_user_id UUID,
  p_tier TEXT,
  p_gold_reward INTEGER,
  p_life_reward INTEGER,
  p_idempotency_key TEXT,
  p_open_cost INTEGER DEFAULT 150
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lootbox RECORD;
  v_user_gold INTEGER;
  v_credit_result JSONB;
BEGIN
  -- 1. Lock and validate lootbox
  SELECT * INTO v_lootbox
  FROM public.lootbox_instances
  WHERE id = p_lootbox_id
    AND user_id = p_user_id
    AND status IN ('active_drop', 'stored')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'LOOTBOX_NOT_FOUND_OR_INVALID'
    );
  END IF;

  -- 2. Check user has enough gold ONLY if opening cost > 0
  IF p_open_cost > 0 THEN
    SELECT COALESCE(coins, 0) INTO v_user_gold
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_user_gold < p_open_cost THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'NOT_ENOUGH_GOLD',
        'required', p_open_cost,
        'current', v_user_gold
      );
    END IF;

    -- 3. Deduct gold (negative amount) ONLY if cost > 0
    INSERT INTO public.wallet_ledger (
      user_id,
      delta_coins,
      delta_lives,
      source,
      idempotency_key,
      metadata
    ) VALUES (
      p_user_id,
      -p_open_cost,
      0,
      'lootbox_open_cost',
      p_idempotency_key || '_cost',
      jsonb_build_object(
        'lootbox_id', p_lootbox_id,
        'tier', p_tier
      )
    );

    -- Update profile coins
    UPDATE public.profiles
    SET coins = coins - p_open_cost
    WHERE id = p_user_id;
  END IF;

  -- 4. Credit rewards using credit_wallet
  SELECT public.credit_wallet(
    p_user_id,
    p_gold_reward,
    p_life_reward,
    'lootbox_reward',
    p_idempotency_key || '_reward',
    jsonb_build_object(
      'lootbox_id', p_lootbox_id,
      'tier', p_tier,
      'gold', p_gold_reward,
      'life', p_life_reward
    )
  ) INTO v_credit_result;

  IF NOT (v_credit_result->>'success')::boolean THEN
    RAISE EXCEPTION 'Failed to credit lootbox rewards';
  END IF;

  -- 5. Update lootbox to opened
  UPDATE public.lootbox_instances
  SET
    status = 'opened',
    opened_at = NOW(),
    rewards_gold = p_gold_reward,
    rewards_life = p_life_reward,
    open_cost_gold = p_open_cost
  WHERE id = p_lootbox_id;

  -- 6. Return success with updated lootbox data
  RETURN jsonb_build_object(
    'success', true,
    'lootbox', (
      SELECT jsonb_build_object(
        'id', id,
        'status', status,
        'opened_at', opened_at,
        'rewards_gold', rewards_gold,
        'rewards_life', rewards_life,
        'open_cost_gold', open_cost_gold
      )
      FROM public.lootbox_instances
      WHERE id = p_lootbox_id
    ),
    'rewards', jsonb_build_object(
      'gold', p_gold_reward,
      'life', p_life_reward,
      'tier', p_tier
    ),
    'new_balance', jsonb_build_object(
      'gold', v_credit_result->'new_coins',
      'life', v_credit_result->'new_lives'
    )
  );
END;
$$;