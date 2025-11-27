-- Add translation for Gifts/Lootbox navigation item
INSERT INTO translations (key, hu, en)
VALUES ('nav.gifts', 'Ajándékaim', 'My Gifts')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;