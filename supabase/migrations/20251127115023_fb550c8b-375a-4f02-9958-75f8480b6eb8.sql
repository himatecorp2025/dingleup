-- Add missing translation keys for Advanced Analytics page

INSERT INTO public.translations (key, hu, en) VALUES
('admin.advanced.title', 'Fejlett Analitika', 'Advanced Analytics'),
('admin.advanced.retention_title', 'Megtartás', 'Retention'),
('admin.advanced.retention_desc', 'Felhasználói megtartási metrikák és kohorsz elemzések', 'User retention metrics and cohort analysis'),
('admin.advanced.monetization_title', 'Monetizáció', 'Monetization'),
('admin.advanced.monetization_desc', 'Bevételi statisztikák és konverziós arányok', 'Revenue statistics and conversion rates'),
('admin.advanced.performance_title', 'Teljesítmény', 'Performance'),
('admin.advanced.performance_desc', 'Oldalbetöltési sebességek és teljesítmény mutatók', 'Page load speeds and performance metrics'),
('admin.advanced.engagement_title', 'Elkötelezettség', 'Engagement'),
('admin.advanced.engagement_desc', 'Felhasználói aktivitás és funkció használati statisztikák', 'User activity and feature usage statistics'),
('admin.advanced.journey_title', 'Felhasználói Útvonal', 'User Journey'),
('admin.advanced.journey_desc', 'Felhasználói útkeresés és konverziós tölcsérek', 'User pathways and conversion funnels')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();