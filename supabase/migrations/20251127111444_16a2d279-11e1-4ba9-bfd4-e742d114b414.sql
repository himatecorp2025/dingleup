-- Add translation keys for AdminProfile.tsx (67 new keys)

INSERT INTO public.translations (key, hu, en) VALUES
-- AdminProfile.tsx
('admin.profile.title', 'Profil Szerkesztése', 'Edit Profile'),
('admin.profile.description', 'Admin fiók beállításainak kezelése', 'Manage admin account settings'),
('admin.profile.loading', 'Betöltés...', 'Loading...'),

-- Username section
('admin.profile.username_section_title', 'Felhasználónév Módosítása', 'Change Username'),
('admin.profile.username_section_description', '7 naponta módosítható', 'Can be changed every 7 days'),
('admin.profile.current_username', 'Jelenlegi felhasználónév', 'Current username'),
('admin.profile.edit_button', 'Szerkesztés', 'Edit'),
('admin.profile.save_button', 'Mentés', 'Save'),
('admin.profile.cancel_button', 'Mégse', 'Cancel'),

-- PIN section
('admin.profile.pin_section_title', 'PIN Kód Módosítása', 'Change PIN Code'),
('admin.profile.pin_section_description', 'A bejelentkezési PIN kód megváltoztatása', 'Change your login PIN code'),
('admin.profile.current_pin', 'Jelenlegi PIN kód', 'Current PIN code'),
('admin.profile.new_pin', 'Új PIN kód', 'New PIN code'),
('admin.profile.confirm_pin', 'Új PIN kód megerősítése', 'Confirm new PIN code'),
('admin.profile.save_pin_button', 'PIN Kód Mentése', 'Save PIN Code'),
('admin.profile.pin_placeholder', '••••••', '••••••'),

-- Grant Admin section
('admin.profile.grant_admin_section_title', 'Admin Jogosultság Adása', 'Grant Admin Rights'),
('admin.profile.grant_admin_section_description', 'Felhasználónak admin jogosultság megadása', 'Grant admin rights to a user'),
('admin.profile.username_label', 'Felhasználónév', 'Username'),
('admin.profile.username_placeholder', 'Felhasználónév', 'Username'),
('admin.profile.processing', 'Feldolgozás...', 'Processing...'),
('admin.profile.grant_admin_button', 'Admin Jogosultság Megadása', 'Grant Admin Rights'),

-- Error/validation messages
('admin.profile.pin_validation_error', 'A PIN-nek pontosan 6 számjegyből kell állnia', 'PIN must consist of exactly 6 digits'),
('admin.profile.pin_update_error', 'Hibás jelenlegi PIN', 'Incorrect current PIN'),
('admin.profile.username_update_error', 'Felhasználónév frissítés sikertelen', 'Username update failed')

ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();