-- Add missing translation keys for components

INSERT INTO translations (key, hu, en)
VALUES 
  ('common.loading', 'Betöltés...', 'Loading...'),
  ('admin.friendships_sync_starting', 'Manuális barátság-szinkronizálás indítása...', 'Starting manual friendship synchronization...'),
  ('admin.searching_truncated_translations', 'Csonka fordítások keresése...', 'Searching for truncated translations...'),
  ('admin.translating_to_language', 'Fordítás {language} nyelvre...', 'Translating to {language}...'),
  ('admin.successful', 'Sikeres', 'Successful'),
  ('admin.error', 'Hiba', 'Error'),
  ('admin.deleting_retranslating_truncated', 'Csonka fordítások törlése és újrafordítása...', 'Deleting and re-translating truncated translations...'),
  ('admin.translation_complete', 'Fordítás befejezve!', 'Translation complete!'),
  ('admin.batch', 'Batch', 'Batch')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;