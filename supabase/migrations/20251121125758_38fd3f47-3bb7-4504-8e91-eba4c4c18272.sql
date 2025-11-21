-- Add new auth fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pin_hash TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS webauthn_credential_id TEXT,
ADD COLUMN IF NOT EXISTS webauthn_public_key TEXT,
ADD COLUMN IF NOT EXISTS email_pin_setup_completed BOOLEAN DEFAULT false;

-- Create unique index on email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx ON public.profiles (LOWER(email));

-- Insert i18n keys for account choice
INSERT INTO public.translations (key, hu) VALUES
('auth.accountChoice.title', 'Üdvözöllek a DingleUP!-ban'),
('auth.accountChoice.noAccountButton', 'Nincs fiókom - Új profil létrehozása'),
('auth.accountChoice.hasAccountButton', 'Van fiókom - Bejelentkezés'),
('auth.accountChoice.description', 'Válaszd ki, hogyan szeretnél folytatni')
ON CONFLICT (key) DO NOTHING;

-- Insert i18n keys for email+PIN setup
INSERT INTO public.translations (key, hu) VALUES
('auth.emailPin.title', 'Fiókod védelme'),
('auth.emailPin.description', 'A fiókod védelméhez kérjük add meg az e-mail címedet és állíts be egy 6 jegyű biztonsági kódot.'),
('auth.emailPin.emailLabel', 'E-mail cím'),
('auth.emailPin.pinLabel', '6 jegyű PIN kód'),
('auth.emailPin.pinConfirmLabel', 'PIN megerősítése'),
('auth.emailPin.submitButton', 'Mentés és folytatás'),
('auth.emailPin.errorInvalidPin', 'A PIN kód pontosan 6 számjegyből kell álljon'),
('auth.emailPin.errorInvalidEmail', 'Érvényes e-mail címet adj meg'),
('auth.emailPin.errorPinMismatch', 'A két PIN kód nem egyezik'),
('auth.emailPin.errorEmailTaken', 'Ez az e-mail cím már használatban van'),
('auth.emailPin.successMessage', 'Fiók sikeresen beállítva!')
ON CONFLICT (key) DO NOTHING;

-- Insert i18n keys for biometric setup
INSERT INTO public.translations (key, hu) VALUES
('auth.biometric.title', 'Biometrikus bejelentkezés'),
('auth.biometric.description', 'Szeretnéd engedélyezni a gyors biometrikus bejelentkezést? (ujjlenyomat / arcfelismerés)'),
('auth.biometric.enableButton', 'Engedélyezem'),
('auth.biometric.skipButton', 'Most nem'),
('auth.biometric.errorNotSupported', 'A biometrikus bejelentkezés nem támogatott ezen az eszközön'),
('auth.biometric.successMessage', 'Biometrikus bejelentkezés aktiválva!')
ON CONFLICT (key) DO NOTHING;

-- Insert i18n keys for new login
INSERT INTO public.translations (key, hu) VALUES
('auth.login.title', 'Bejelentkezés'),
('auth.login.emailLabel', 'E-mail cím'),
('auth.login.pinLabel', '6 jegyű PIN kód'),
('auth.login.submitButton', 'Belépés'),
('auth.login.errorInvalidCredentials', 'Hibás e-mail vagy PIN kód'),
('auth.login.orBiometric', 'vagy'),
('auth.login.biometricButton', 'Bejelentkezés biometrikusan'),
('auth.login.resetPinButton', 'Elfelejtetted a PIN kódod?'),
('auth.login.backButton', 'Vissza'),
('auth.login.successMessage', 'Sikeres bejelentkezés!')
ON CONFLICT (key) DO NOTHING;

-- Insert i18n keys for PIN reset
INSERT INTO public.translations (key, hu) VALUES
('auth.pinReset.title', 'PIN kód visszaállítása'),
('auth.pinReset.description', 'Add meg az e-mail címed, és küldünk egy linket a PIN visszaállításához'),
('auth.pinReset.emailLabel', 'E-mail cím'),
('auth.pinReset.submitButton', 'Link küldése'),
('auth.pinReset.successMessage', 'E-mail elküldve! Ellenőrizd a bejövő leveleidet'),
('auth.pinReset.errorUserNotFound', 'Nem található felhasználó ezzel az e-mail címmel')
ON CONFLICT (key) DO NOTHING;