
-- Drop non-hu/en language columns from translations table
ALTER TABLE translations 
DROP COLUMN IF EXISTS de,
DROP COLUMN IF EXISTS fr,
DROP COLUMN IF EXISTS es,
DROP COLUMN IF EXISTS it,
DROP COLUMN IF EXISTS pt,
DROP COLUMN IF EXISTS nl;

-- Add constraint to ensure only hu/en languages in question_translations
ALTER TABLE question_translations
DROP CONSTRAINT IF EXISTS question_translations_lang_check;

ALTER TABLE question_translations
ADD CONSTRAINT question_translations_lang_check 
CHECK (lang IN ('hu', 'en'));

-- Update profiles.preferred_language to only allow hu/en
UPDATE profiles
SET preferred_language = 'en'
WHERE preferred_language NOT IN ('hu', 'en');
