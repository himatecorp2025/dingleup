-- wallet_ledger: minden egyenlegváltozás naplózása (idempotens)
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta_coins integer NOT NULL DEFAULT 0,
  delta_lives integer NOT NULL DEFAULT 0,
  source text NOT NULL CHECK (source IN (
    'welcome', 'daily', 'speed_tick', 'purchase', 'refund', 
    'admin', 'game_reward', 'invitation', 'weekly_reward', 
    'booster_purchase', 'life_purchase'
  )),
  idempotency_key text NOT NULL UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_id ON public.wallet_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_idempotency ON public.wallet_ledger(idempotency_key);

-- Enable RLS
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ledger"
ON public.wallet_ledger
FOR SELECT
USING (auth.uid() = user_id);

-- Add speed tick tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS speed_tick_last_processed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS speed_coins_per_tick integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS speed_lives_per_tick integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS speed_tick_interval_seconds integer DEFAULT 60;

-- Function to credit wallet with idempotency
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
SET search_path TO 'public'
AS $$
DECLARE
  v_current_coins integer;
  v_current_lives integer;
  v_max_lives integer;
  v_new_lives integer;
BEGIN
  -- Check if already processed (idempotency)
  IF EXISTS (SELECT 1 FROM public.wallet_ledger WHERE idempotency_key = p_idempotency_key) THEN
    RETURN json_build_object('success', true, 'already_processed', true);
  END IF;

  -- Get current balances
  SELECT coins, lives, max_lives INTO v_current_coins, v_current_lives, v_max_lives
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Validate: no negative balance
  IF (v_current_coins + p_delta_coins) < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient coins');
  END IF;
  
  IF (v_current_lives + p_delta_lives) < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient lives');
  END IF;

  -- Calculate new lives (can exceed max during credit operations)
  v_new_lives := v_current_lives + p_delta_lives;

  -- Insert ledger entry
  INSERT INTO public.wallet_ledger (
    user_id, delta_coins, delta_lives, source, idempotency_key, metadata
  ) VALUES (
    p_user_id, p_delta_coins, p_delta_lives, p_source, p_idempotency_key, p_metadata
  );

  -- Update profile balances (INCREMENT, not SET)
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
$$;

COMMENT ON FUNCTION public.credit_wallet IS 'Idempotent wallet credit/debit with ledger tracking';

-- Function to calculate next life regeneration time
CREATE OR REPLACE FUNCTION public.get_next_life_at(p_user_id uuid)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_last_regen timestamp with time zone;
  v_regen_rate integer;
  v_lives integer;
  v_max_lives integer;
  v_next_life_at timestamp with time zone;
BEGIN
  SELECT last_life_regeneration, lives_regeneration_rate, lives, max_lives
  INTO v_last_regen, v_regen_rate, v_lives, v_max_lives
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND OR v_lives >= v_max_lives THEN
    RETURN NULL;
  END IF;

  -- Calculate next life time
  v_next_life_at := v_last_regen + (v_regen_rate * INTERVAL '1 minute');
  
  RETURN v_next_life_at;
END;
$$;