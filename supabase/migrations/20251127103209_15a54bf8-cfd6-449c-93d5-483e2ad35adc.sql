-- Add missing translation keys for admin and invitation pages

-- Admin Profile
INSERT INTO translations (key, hu, en)
VALUES 
  ('admin.error_loading_profile', 'Profil betöltése sikertelen', 'Failed to load profile'),
  ('admin.error_username_empty', 'A felhasználónév nem lehet üres', 'Username cannot be empty'),
  ('admin.success_username_updated', 'Felhasználónév frissítve', 'Username updated'),
  ('admin.error_all_fields_required', 'Minden mező kitöltése kötelező', 'All fields are required'),
  ('admin.error_pins_not_match', 'Az új PIN-ek nem egyeznek', 'New PINs do not match'),
  ('admin.success_pin_updated', 'PIN sikeresen módosítva', 'PIN successfully updated'),
  ('admin.error_enter_username', 'Add meg a felhasználónevet', 'Enter username'),
  ('admin.error_user_not_found', 'Felhasználó nem található', 'User not found'),
  ('admin.load_test_success', 'Terhelés teszt sikeresen befejezve', 'Load test completed successfully'),
  ('admin.load_test_error', 'Terhelés teszt sikertelen', 'Failed to execute load test'),
  ('admin.error_occurred', 'Hiba történt', 'An error occurred'),
  ('admin.translation_errors_occurred', '{count} hiba történt a fordítás során', '{count} errors occurred during translation')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;

-- Invitation page
INSERT INTO translations (key, hu, en)
VALUES 
  ('invitation.error_loading_data', 'Meghívó adatok betöltése sikertelen', 'Failed to load invitation data'),
  ('invitation.code_copied', 'Meghívó kód másolva', 'Invitation code copied'),
  ('invitation.link_copied', 'Meghívó link másolva', 'Invitation link copied'),
  ('invitation.error_copying', 'Másolási hiba', 'Copy error')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;