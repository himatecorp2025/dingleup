-- Add new columns to profiles table for age-gate and auto-registration
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS device_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS legal_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS legal_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_login_age_gate_completed BOOLEAN DEFAULT FALSE;

-- Create index on device_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON public.profiles(device_id);

-- Update existing users to have age_gate completed (backward compatibility)
-- Assuming existing users are already verified
UPDATE public.profiles 
SET first_login_age_gate_completed = TRUE,
    age_verified = TRUE,
    legal_consent = TRUE,
    legal_consent_at = NOW()
WHERE first_login_age_gate_completed = FALSE OR first_login_age_gate_completed IS NULL;

-- Insert age-gate i18n keys into translations table
INSERT INTO public.translations (key, hu, en, de, fr, es, it, pt, nl, created_at, updated_at)
VALUES
  ('auth.age_gate.title', 'Korhatár ellenőrzés', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.description', 'A DingleUP! használatához be kell töltened a 16. életévedet. Kérjük, add meg a születési dátumodat és fogadd el a feltételeket.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.year_label', 'Év', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.month_label', 'Hónap', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.day_label', 'Nap', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.consent_label', 'Kijelentem, hogy a megadott születési dátumom valós, és ezzel együtt elfogadom az {terms} és az {privacy}.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.link_terms', 'Általános Szerződési Feltételeket', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.link_privacy', 'Adatkezelési Tájékoztatót', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.submit_button', 'Megerősítés', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.error_consent_required', 'Kérjük, fogadd el a feltételeket a folytatáshoz.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.error_invalid_dob', 'Kérjük, adj meg érvényes születési dátumot.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.error_underage', 'A DingleUP! csak 16 éves kortól használható.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.exit_button', 'Kilépés az alkalmazásból', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('auth.age_gate.underage_message', 'Sajnáljuk, de a DingleUP! használatához be kell töltened a 16. életévedet. Kérjük, térj vissza később!', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;