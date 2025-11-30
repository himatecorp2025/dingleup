-- Insert Hungarian and English translations for Forgot PIN feature
INSERT INTO translations (key, hu, en) VALUES
-- Forgot PIN page
('auth.forgotPin.title', 'PIN visszaállítás', 'PIN Reset'),
('auth.forgotPin.subtitle', 'Add meg a felhasználóneved és a helyreállítási kódodat az új PIN beállításához', 'Enter your username and recovery code to set a new PIN'),
('auth.forgotPin.usernameLabel', 'Felhasználónév', 'Username'),
('auth.forgotPin.usernamePlaceholder', 'Add meg a felhasználónevedet', 'Enter your username'),
('auth.forgotPin.recoveryCodeLabel', 'Helyreállítási kód', 'Recovery Code'),
('auth.forgotPin.recoveryCodePlaceholder', 'XXXX-XXXX-XXXX', 'XXXX-XXXX-XXXX'),
('auth.forgotPin.newPinLabel', 'Új PIN kód', 'New PIN'),
('auth.forgotPin.newPinPlaceholder', '6 számjegy', '6 digits'),
('auth.forgotPin.newPinConfirmLabel', 'Új PIN megerősítése', 'Confirm New PIN'),
('auth.forgotPin.submitButton', 'PIN visszaállítása', 'Reset PIN'),
('auth.forgotPin.submittingButton', 'Feldolgozás...', 'Processing...'),
('auth.forgotPin.backButton', 'Vissza', 'Back'),
('auth.forgotPin.backToLogin', 'Vissza a bejelentkezéshez', 'Back to Login'),
('auth.forgotPin.showPin', 'PIN mutatása', 'Show PIN'),
('auth.forgotPin.hidePin', 'PIN elrejtése', 'Hide PIN'),

-- Validation messages
('auth.forgotPin.validationUsernameRequired', 'A felhasználónév megadása kötelező', 'Username is required'),
('auth.forgotPin.validationRecoveryCodeRequired', 'A helyreállítási kód megadása kötelező', 'Recovery code is required'),
('auth.forgotPin.validationRecoveryCodeFormat', 'A helyreállítási kód formátuma: XXXX-XXXX-XXXX', 'Recovery code format: XXXX-XXXX-XXXX'),
('auth.forgotPin.validationPinFormat', 'Az új PIN pontosan 6 számjegyből kell álljon', 'The new PIN must be exactly 6 digits'),
('auth.forgotPin.validationPinMismatch', 'Az új PIN kódok nem egyeznek', 'The new PIN codes do not match'),

-- Error messages
('auth.forgotPin.error_title', 'Hiba történt', 'Error occurred'),
('auth.forgotPin.errorResetFailed', 'A PIN visszaállítása sikertelen', 'PIN reset failed'),
('auth.forgotPin.errorResetUnsuccessful', 'A PIN visszaállítása sikertelen volt', 'PIN reset was unsuccessful'),
('auth.forgotPin.errorUnexpected', 'Váratlan hiba történt', 'An unexpected error occurred'),

-- Success messages
('auth.forgotPin.successTitle', 'Sikeres PIN visszaállítás!', 'PIN Reset Successful!'),
('auth.forgotPin.successMessage', 'A PIN kódod sikeresen frissült. Most már bejelentkezhetsz az új PIN kóddal.', 'Your PIN has been successfully updated. You can now log in with your new PIN.'),
('auth.forgotPin.newRecoveryCodeLabel', 'Új helyreállítási kód:', 'New Recovery Code:'),
('auth.forgotPin.newRecoveryCodeWarning', 'FONTOS: Írd fel vagy mentsd el ezt az új helyreállítási kódot biztonságos helyen! Ezt a kódot nem küldjük el újra.', 'IMPORTANT: Write down or save this new recovery code in a safe place! We will not send this code again.'),
('auth.forgotPin.continueToLogin', 'Tovább a bejelentkezéshez', 'Continue to Login'),

-- Login page forgot PIN link
('auth.login.forgotPin', 'Elfelejtettem a PIN kódomat', 'Forgot my PIN')
ON CONFLICT (key) DO UPDATE SET 
  hu = EXCLUDED.hu, 
  en = EXCLUDED.en,
  updated_at = NOW();
