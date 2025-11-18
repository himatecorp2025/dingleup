-- Fix wallet_ledger source constraint to allow 'game_start' and keep existing sources
ALTER TABLE public.wallet_ledger 
DROP CONSTRAINT IF EXISTS wallet_ledger_source_check;

ALTER TABLE public.wallet_ledger 
ADD CONSTRAINT wallet_ledger_source_check CHECK (source IN (
  'welcome', 'daily', 'game_start', 'speed_tick', 'purchase', 'refund', 
  'admin', 'game_reward', 'invitation', 'weekly_reward', 
  'booster_purchase', 'life_purchase'
));