-- Set all existing users to Hungary (HU) country code
UPDATE profiles 
SET country_code = 'HU' 
WHERE country_code IS NULL OR country_code = '' OR country_code != 'HU';

-- Ensure default value is set to HU for future records
ALTER TABLE profiles 
ALTER COLUMN country_code SET DEFAULT 'HU';