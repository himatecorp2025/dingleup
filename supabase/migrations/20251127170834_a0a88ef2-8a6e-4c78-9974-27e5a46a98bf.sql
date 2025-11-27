-- Add lootbox source values to wallet_ledger_source_check constraint
ALTER TABLE public.wallet_ledger
DROP CONSTRAINT IF EXISTS wallet_ledger_source_check;

ALTER TABLE public.wallet_ledger
ADD CONSTRAINT wallet_ledger_source_check CHECK (
  source = ANY (ARRAY[
    'welcome'::text,
    'daily'::text,
    'game_start'::text,
    'speed_tick'::text,
    'purchase'::text,
    'refund'::text,
    'admin'::text,
    'game_reward'::text,
    'invitation'::text,
    'weekly_reward'::text,
    'booster_purchase'::text,
    'life_purchase'::text,
    'like_popup_reward'::text,
    'lootbox_open_cost'::text,
    'lootbox_reward'::text
  ])
);