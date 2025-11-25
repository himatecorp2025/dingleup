-- Add missing translation keys for ALL popups, toasts, errors, and system messages
-- Ensures complete hu/en bilingual coverage

INSERT INTO translations (key, hu, en) VALUES
-- Game interruption messages
('game.interrupted', 'A játék megszakadt!', 'Game interrupted!'),
('game.session_expired', 'A munkameneted lejárt. Kérlek, jelentkezz be újra!', 'Your session has expired. Please log in again!'),
('game.not_logged_in', 'Nincs bejelentkezve! Kérlek, jelentkezz be!', 'Not logged in! Please log in!'),
('game.error_loading_questions', 'Hiba történt a kérdések betöltésekor!', 'Error loading questions!'),
('game.insufficient_lives', 'Nincs elég életed a játék indításához!', 'Not enough lives to start the game!'),
('game.restart_lost_gold', 'Újraindítva! Elvesztetted az összegyűjtött aranyérméidet.', 'Restarted! You lost your collected gold coins.'),
('game.exit_lost_gold', 'Kilépés... Elvesztetted az összegyűjtött aranyérméidet!', 'Exiting... You lost your collected gold coins!'),

-- In-game rescue popup messages
('rescue.insufficient_gold', 'Nincs elég aranyérméd a mentőcsomag megvásárlásához!', 'Not enough gold to purchase the rescue package!'),
('rescue.not_logged_in', 'Nincs bejelentkezve! Kérlek, jelentkezz be!', 'Not logged in! Please log in!'),
('rescue.free_success', 'Sikeres vásárlás! +30 aranyérme és +3 élet hozzáadva!', 'Successful purchase! +30 gold and +3 lives added!'),
('rescue.free_error', 'Sikertelen vásárlás!', 'Purchase failed!'),
('rescue.purchase_error', 'Hiba történt a vásárlás során!', 'An error occurred during purchase!'),
('rescue.premium_success', 'Sikeres vásárlás! +1500 aranyérme és +50 élet hozzáadva!', 'Successful purchase! +1500 gold and +50 lives added!'),
('rescue.premium_payment_failed', 'A fizetés sikertelen volt!', 'Payment failed!'),

-- Admin messages
('admin.session_expired', 'Lejárt admin munkamenet. Jelentkezz be újra az admin felületen.', 'Admin session expired. Please log in again on the admin interface.'),
('admin.no_session', 'Nincs admin munkamenet', 'No admin session'),
('admin.send_error', 'Hiba történt a küldés közben. Próbáld újra.', 'An error occurred while sending. Please try again.'),
('admin.field_required', 'Az üzenet mező kötelező!', 'The message field is required!'),
('admin.message_too_short', 'Az üzenet túl rövid (minimum 10 karakter)!', 'Message too short (minimum 10 characters)!'),
('admin.message_too_long', 'Az üzenet túl hosszú (maximum 2000 karakter)!', 'Message too long (maximum 2000 characters)!'),

-- Translation/question management
('admin.translation_error', 'Hiba történt a fordítás közben', 'An error occurred during translation'),
('admin.all_translations_complete', 'Minden kérdés fordítása teljes és rendben van!', 'All question translations are complete and correct!'),
('admin.truncated_deleted', 'csonka fordítás törölve és újrafordítva!', 'truncated translations deleted and re-translated!'),
('admin.translation_errors', 'hiba történt a fordítás során.', 'errors occurred during translation.'),
('admin.translation_result_unknown', 'A fordítás eredménye nem ismert', 'Translation result unknown'),
('admin.unexpected_error', 'Váratlan hiba történt', 'An unexpected error occurred')

ON CONFLICT (key) DO UPDATE SET 
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;