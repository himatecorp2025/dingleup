-- Add remaining critical toast/popup translation keys for Dashboard and game hooks

INSERT INTO translations (key, hu, en) VALUES
-- Dashboard speed boost messages
('dashboard.login_required', 'Bejelentkezés szükséges', 'Login required'),
('dashboard.activating_premium', 'Prémium sebességfokozó aktiválása...', 'Activating premium speed booster...'),
('dashboard.not_logged_in', 'Nincs bejelentkezve', 'Not logged in'),
('dashboard.premium_activated', 'Aktiválva: {count}x sebességfokozó ({minutes} perc)', 'Activated: {count}x speed booster ({minutes} minutes)'),
('dashboard.premium_already_active', 'Prémium már aktiválva', 'Premium already active'),
('dashboard.loading_payment', 'Fizetés betöltése...', 'Loading payment...'),
('dashboard.payment_opened', 'Fizetési oldal megnyitva', 'Payment page opened'),
('dashboard.payment_url_missing', 'Fizetési URL hiányzik', 'Payment URL missing'),
('dashboard.payment_error', 'Fizetési hiba', 'Payment error'),
('dashboard.activation_error', 'Aktiválási hiba', 'Activation error'),
('dashboard.payment_cancelled', 'Visszaléptél, a jutalmad elveszett!', 'You went back, your reward is lost!'),

-- Game helper action messages
('game.insufficient_gold', 'Nincs elég aranyérméd! {cost} aranyérme szükséges.', 'Not enough gold! {cost} gold required.'),
('game.help_activation_error', 'Hiba történt a segítség aktiválásakor!', 'Error activating help!'),
('game.skip_insufficient_gold', 'Nincs elég aranyérméd a kérdés átugrásához! {cost} aranyérme szükséges.', 'Not enough gold to skip question! {cost} gold required.'),

-- Welcome bonus messages
('welcome.claim_error', 'Hiba történt a bónusz felvételekor', 'Error claiming bonus'),
('welcome.claim_success', '🎉 Üdvözlő bónusz felvéve! +{coins} aranyérme, +{lives} élet', '🎉 Welcome bonus claimed! +{coins} gold, +{lives} lives'),

-- Game realtime messages
('game.coins_earned', '+{coins} érme! 💰', '+{coins} coins! 💰'),
('game.lives_earned', '+{lives} élet! ❤️', '+{lives} lives! ❤️'),

-- Auth/session messages
('auth.not_logged_in_generic', 'Nem vagy bejelentkezve', 'You are not logged in'),
('auth.like_update_failed', 'Nem sikerült frissíteni a lájkot', 'Failed to update like'),
('auth.inactive_logout', 'Biztonsági okokból kijelentkeztettünk 10 perc inaktivitás miatt', 'You have been logged out due to 10 minutes of inactivity for security reasons')

ON CONFLICT (key) DO UPDATE SET 
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;