
-- Drop the old 6-parameter version of open_lootbox_transaction
-- This fixes the function overloading error where PostgreSQL cannot choose
-- between the old (6 params) and new (7 params) versions

DROP FUNCTION IF EXISTS public.open_lootbox_transaction(
  p_lootbox_id uuid,
  p_user_id uuid,
  p_tier text,
  p_gold_reward integer,
  p_life_reward integer,
  p_idempotency_key text
);

-- The 7-parameter version with p_open_cost DEFAULT 150 remains active
-- and will be the only version going forward
