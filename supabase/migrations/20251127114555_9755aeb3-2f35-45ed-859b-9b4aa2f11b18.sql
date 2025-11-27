-- Add language.english key for UI display
INSERT INTO translations (key, hu, en) VALUES
('language.english', 'Angol', 'English')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();