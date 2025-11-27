-- Add translation keys for rank reward system and error messages
INSERT INTO public.translations (key, hu, en) VALUES
-- Rank reward toast messages
('rank_reward.claim_error_title', 'Hiba', 'Error'),
('rank_reward.claim_error_desc', 'Nem sikerült felvenni a jutalmat. Próbáld újra később.', 'Failed to claim reward. Please try again later.'),
('rank_reward.claim_success_title', '🎉 Jutalom felvéve!', '🎉 Reward Claimed!'),
('rank_reward.claim_success_desc', '+{gold} arany, +{lives} élet', '+{gold} gold, +{lives} lives'),
('rank_reward.claim_exception_desc', 'Hiba történt a jutalom felvétele során.', 'An error occurred while claiming the reward.'),
-- Generic error messages
('errors.unknown_error', 'Ismeretlen hiba történt', 'Unknown error occurred')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();