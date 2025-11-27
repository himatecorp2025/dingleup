-- Create lootbox_instances table
CREATE TABLE IF NOT EXISTS public.lootbox_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('random_drop', 'purchase', 'test')),
  status TEXT NOT NULL CHECK (status IN ('active_drop', 'stored', 'opened', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  opened_at TIMESTAMPTZ NULL,
  rewards_gold INTEGER NULL,
  rewards_life INTEGER NULL,
  open_cost_gold INTEGER NOT NULL DEFAULT 150,
  metadata JSONB NULL
);

-- Enable RLS
ALTER TABLE public.lootbox_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view only their own lootboxes
CREATE POLICY "Users can view their own lootboxes"
ON public.lootbox_instances
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Service role has full access
CREATE POLICY "Service role has full access to lootboxes"
ON public.lootbox_instances
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policy: Admins can view all lootboxes
CREATE POLICY "Admins can view all lootboxes"
ON public.lootbox_instances
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_lootbox_instances_user_id ON public.lootbox_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_lootbox_instances_status ON public.lootbox_instances(status);
CREATE INDEX IF NOT EXISTS idx_lootbox_instances_user_status ON public.lootbox_instances(user_id, status);

-- PostgreSQL function: open_lootbox_transaction
-- Handles the entire lootbox opening transaction atomically
CREATE OR REPLACE FUNCTION public.open_lootbox_transaction(
  p_lootbox_id UUID,
  p_user_id UUID,
  p_tier TEXT,
  p_gold_reward INTEGER,
  p_life_reward INTEGER,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lootbox RECORD;
  v_user_gold INTEGER;
  v_open_cost INTEGER := 150;
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

  -- 2. Check user has enough gold
  SELECT COALESCE(coins, 0) INTO v_user_gold
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_user_gold < v_open_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NOT_ENOUGH_GOLD',
      'required', v_open_cost,
      'current', v_user_gold
    );
  END IF;

  -- 3. Deduct gold (negative amount)
  INSERT INTO public.wallet_ledger (
    user_id,
    delta_coins,
    delta_lives,
    source,
    idempotency_key,
    metadata
  ) VALUES (
    p_user_id,
    -v_open_cost,
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
  SET coins = coins - v_open_cost
  WHERE id = p_user_id;

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
    open_cost_gold = v_open_cost
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