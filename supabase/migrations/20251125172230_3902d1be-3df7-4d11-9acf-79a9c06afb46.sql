INSERT INTO translations (key, hu, en)
VALUES 
('common.and', 'és', 'and')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, 
    en = EXCLUDED.en;