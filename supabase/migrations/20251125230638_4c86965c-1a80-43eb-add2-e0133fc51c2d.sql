-- Final cleanup: Remove any remaining non-hu/en translations
-- This ensures 100% clean database with ONLY Hungarian and English

-- Delete all non-hu/en question translations (final pass)
DELETE FROM question_translations 
WHERE lang NOT IN ('hu', 'en');

-- Add constraint to prevent future non-hu/en entries in question_translations
ALTER TABLE question_translations 
DROP CONSTRAINT IF EXISTS question_translations_lang_check;

ALTER TABLE question_translations
ADD CONSTRAINT question_translations_lang_check 
CHECK (lang IN ('hu', 'en'));

-- Ensure profiles.preferred_language is constrained to hu/en only
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_preferred_language_check
CHECK (preferred_language IN ('hu', 'en') OR preferred_language IS NULL);