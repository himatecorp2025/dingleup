-- Add missing common.dashboard translation key
INSERT INTO public.translations (key, hu, en) VALUES
('common.dashboard', 'Dashboard', 'Dashboard')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;