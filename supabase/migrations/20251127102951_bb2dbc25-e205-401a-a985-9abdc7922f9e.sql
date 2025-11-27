-- Add missing translation keys for errors and admin messages

-- errors.not_logged_in
INSERT INTO translations (key, hu, en)
VALUES ('errors.not_logged_in', 'Nem vagy bejelentkezve', 'You are not logged in')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.session_expired
INSERT INTO translations (key, hu, en)
VALUES ('admin.session_expired', 'Admin munkamenet lejárt', 'Admin session expired')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.error_loading_data
INSERT INTO translations (key, hu, en)
VALUES ('admin.error_loading_data', 'Kritikus hiba az adatok betöltésekor', 'Critical error loading data')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.error_invalid_credentials
INSERT INTO translations (key, hu, en)
VALUES ('admin.error_invalid_credentials', 'Hibás felhasználónév vagy PIN', 'Invalid username or PIN')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.error_no_admin_permission
INSERT INTO translations (key, hu, en)
VALUES ('admin.error_no_admin_permission', 'Nincs admin jogosultságod', 'You do not have admin permission')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.success_admin_login
INSERT INTO translations (key, hu, en)
VALUES ('admin.success_admin_login', 'Sikeres admin bejelentkezés', 'Successfully logged in as admin')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.error_login_failed
INSERT INTO translations (key, hu, en)
VALUES ('admin.error_login_failed', 'Bejelentkezés sikertelen', 'Login failed')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.success_recalculated
INSERT INTO translations (key, hu, en)
VALUES ('admin.success_recalculated', 'Újraszámítás sikeres: {count} felhasználó-téma pár feldolgozva', 'Recalculation successful: {count} user-topic pairs processed')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.error_recalculating_ad_interests
INSERT INTO translations (key, hu, en)
VALUES ('admin.error_recalculating_ad_interests', 'Hiba az érdeklődési körök újraszámításakor', 'Error recalculating ad interests')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.error_loading_all_topics
INSERT INTO translations (key, hu, en)
VALUES ('admin.error_loading_all_topics', 'Hiba az összes téma betöltésekor', 'Error loading all topics')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.error_loading_topic_summary
INSERT INTO translations (key, hu, en)
VALUES ('admin.error_loading_topic_summary', 'Hiba a téma összegzés betöltésekor', 'Error loading topic summary')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- admin.error_loading_user_interests
INSERT INTO translations (key, hu, en)
VALUES ('admin.error_loading_user_interests', 'Hiba a felhasználói érdeklődési körök betöltésekor', 'Error loading user interests')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;