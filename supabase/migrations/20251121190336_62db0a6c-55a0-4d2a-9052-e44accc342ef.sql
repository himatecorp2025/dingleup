-- Add i18n keys for age-gate modal
INSERT INTO public.translations (key, hu, en, de, fr, es, it, pt, nl) VALUES
('ageGate.title', 'Kérjük, add meg a születési dátumodat', 'Please enter your date of birth', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.description', 'A játék használatához meg kell adnod a születési dátumodat. A játék csak 16 éves kortól használható.', 'You need to provide your date of birth to use the game. The game is only available from age 16.', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.yearLabel', 'Év', 'Year', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.monthLabel', 'Hónap', 'Month', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.dayLabel', 'Nap', 'Day', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.submitButton', 'Megerősítem', 'Confirm', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.consentLabel', 'Kijelentem, hogy a megadott születési dátumom a valóságnak megfelel, és elfogadom az', 'I confirm that my date of birth is accurate and I accept the', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.termsLinkLabel', 'Általános Szerződési Feltételeket', 'Terms of Service', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.privacyLinkLabel', 'Adatkezelési tájékoztatót', 'Privacy Policy', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.errorUnderage', 'A játék csak 16 éves kortól használható. Jelentkezz ki és térj vissza később!', 'The game is only available from age 16. Please log out and come back later!', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.errorInvalidDate', 'Érvénytelen dátumot adtál meg. Kérjük, ellenőrizd!', 'Invalid date entered. Please check!', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.errorConsentRequired', 'A checkbox pipálása kötelező.', 'Checkbox confirmation is required.', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.errorGeneric', 'Hiba történt az adatok mentése közben.', 'Error occurred while saving data.', NULL, NULL, NULL, NULL, NULL, NULL),
('ageGate.successMessage', 'Sikeres mentés! Használhatod a játékot.', 'Successfully saved! You can use the game now.', NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();