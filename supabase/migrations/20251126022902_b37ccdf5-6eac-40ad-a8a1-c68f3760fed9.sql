-- Add translation for coin reward text in like popup
INSERT INTO public.translations (key, hu, en)
VALUES ('game.like_prompt_coin_reward', 'Aranyérme!', 'Gold Coins!')
ON CONFLICT (key) DO UPDATE SET 
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;

-- Update existing description to be more addictive/rewarding
UPDATE public.translations 
SET 
  hu = 'Lájkold ezt a kérdést és azonnal kapsz 10 extra aranyérmét! Ne hagyd ki ezt a lehetőséget!',
  en = 'Like this question and instantly get 10 extra gold coins! Don''t miss this opportunity!'
WHERE key = 'game.like_prompt_description';