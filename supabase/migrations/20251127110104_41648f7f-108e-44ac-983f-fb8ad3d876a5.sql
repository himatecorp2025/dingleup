-- Add translation keys for remaining components
INSERT INTO public.translations (key, hu, en) VALUES
-- DailyRankRewardDialog labels
('rank_reward.gold_label', 'Arany', 'Gold'),
('rank_reward.lives_label', 'Élet', 'Lives'),
('rank_reward.marketing_text', '🔥 Király vagy! Ma te uralod a táblát! Fogadd el a jutalmat és játssz tovább!', '🔥 You''re amazing! You rule the board today! Claim your reward and keep playing!'),
-- OnboardingTutorial steps
('onboarding.step1_title', 'Üdvözlünk a DingleUp-ban! 🎉', 'Welcome to DingleUp! 🎉'),
('onboarding.step1_desc', 'Ez egy kvízjáték, ahol aranyérméket szerezhetsz a helyes válaszokért! Haladj végig a lépéseken, hogy megismerd az alkalmazás funkcióit.', 'This is a quiz game where you can earn gold coins for correct answers! Go through the steps to learn about the app''s features.'),
('onboarding.step2_title', 'Kezdd el a játékot! 🎮', 'Start playing! 🎮'),
('onboarding.step2_desc', 'A PLAY NOW gombbal indíthatsz új játékot. Válassz kategóriát és válaszolj a kérdésekre! Minden helyes válaszért aranyérméket és pontokat kapsz.', 'Press PLAY NOW to start a new game. Choose a category and answer the questions! You earn gold coins and points for every correct answer.'),
('onboarding.step3_title', 'Életek és újratöltés ❤️', 'Lives and regeneration ❤️'),
('onboarding.step3_desc', 'Minden játékhoz szükséged van életre. Ha elfogy, ne aggódj - automatikusan újratöltődnek 12 percenként!', 'You need a life to play each game. If you run out, don''t worry - they regenerate automatically every 12 minutes!'),
('onboarding.step4_title', 'Napi jutalmak 🎁', 'Daily rewards 🎁'),
('onboarding.step4_desc', 'Jelentkezz be minden nap, és szerezz ingyenes aranyérméket! A sorozat folytatásával egyre több érmét kapsz. 7 nap után újraindul a ciklus.', 'Log in every day and get free gold coins! As you continue your streak, you get more coins. The cycle resets after 7 days.'),
('onboarding.step5_title', 'Ranglista és versenyek 🏆', 'Leaderboard and competitions 🏆'),
('onboarding.step5_desc', 'Versenyezz másokkal a ranglistán! Napi rangsorban versenyezhetsz más játékosokkal. A legjobb játékosok különleges jutalmakat nyernek!', 'Compete with others on the leaderboard! You can compete with other players in daily rankings. The best players win special rewards!'),
('onboarding.step6_title', 'Barátok meghívása 🤝', 'Invite friends 🤝'),
('onboarding.step6_desc', 'Hívd meg barátaidat és szerezz bónuszokat! Minden meghívott barát után extra aranyérméket és életeket kapsz. Oszd meg a meghívó kódodat!', 'Invite your friends and get bonuses! You get extra gold coins and lives for each invited friend. Share your invitation code!'),
('onboarding.button_back', 'Vissza', 'Back'),
('onboarding.button_next', 'Következő', 'Next'),
('onboarding.button_finish', 'Befejezés', 'Finish'),
('onboarding.button_skip', 'Kihagyás', 'Skip'),
-- QuestionLikeButton aria labels
('aria.like_question', 'Kérdés lájkolása', 'Like question'),
('aria.unlike_question', 'Lájk visszavonása', 'Unlike question')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();