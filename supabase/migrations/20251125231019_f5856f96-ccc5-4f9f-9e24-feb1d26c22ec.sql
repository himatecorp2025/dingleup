-- Add more missing translation keys for admin and QuestionTranslationManager components

INSERT INTO translations (key, hu, en) VALUES
-- Admin report action messages
('admin.new_problem_added', 'Új problématípus hozzáadva!', 'New problem type added!'),
('admin.new_dismissal_added', 'Új elutasítási ok hozzáadva!', 'New dismissal reason added!'),
('admin.select_problem_type', 'Kérlek válaszd ki a megoldott problématípust!', 'Please select the solved problem type!'),
('admin.select_dismissal_reason', 'Kérlek válaszd ki az elutasítás okát!', 'Please select the dismissal reason!'),
('admin.status_reviewing', 'folyamatba helyezve', 'under review'),
('admin.status_resolved', 'megoldva', 'resolved'),
('admin.status_dismissed', 'elutasítva', 'dismissed'),
('admin.report_action_success', 'Jelentés {status}, és a felhasználó értesítést kapott!', 'Report {status}, and the user has been notified!'),
('admin.error_with_message', 'Hiba: {message}', 'Error: {message}'),
('admin.unknown_error', 'Ismeretlen hiba történt', 'An unknown error occurred'),

-- QuestionTranslationManager messages
('admin.error_occurred', 'Hiba történt', 'An error occurred'),
('admin.no_truncated_translations', 'Nincs csonka fordítás!', 'No truncated translations!'),
('admin.translations_retranslated', '{count} csonka fordítás törölve és újrafordítva! {success} sikeres.', '{count} truncated translations deleted and re-translated! {success} successful.'),
('admin.translation_errors_count', '{count} hiba történt a fordítás során.', '{count} errors occurred during translation.'),
('admin.unknown_result', 'Ismeretlen eredmény', 'Unknown result')

ON CONFLICT (key) DO UPDATE SET 
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;