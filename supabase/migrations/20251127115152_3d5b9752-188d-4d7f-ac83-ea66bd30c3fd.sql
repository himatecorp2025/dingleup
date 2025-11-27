-- Add missing translation keys for Age Statistics page

INSERT INTO public.translations (key, hu, en) VALUES
('admin.age.title', 'Korosztály Analitika', 'Age Statistics'),
('admin.age.description', 'Felhasználók életkor szerinti megoszlása és statisztikái', 'User distribution and statistics by age'),
('admin.age.registration_period', 'Regisztrációs időszak', 'Registration Period'),
('admin.age.all', 'Összes', 'All'),
('admin.age.last_30_days', 'Utolsó 30 nap', 'Last 30 Days'),
('admin.age.last_90_days', 'Utolsó 90 nap', 'Last 90 Days'),
('admin.age.last_1_year', 'Utolsó 1 év', 'Last 1 Year'),
('admin.age.country', 'Ország', 'Country'),
('admin.age.all_countries', 'Összes ország', 'All Countries'),
('admin.age.countries.hu', 'Magyarország', 'Hungary'),
('admin.age.countries.us', 'Egyesült Államok', 'United States'),
('admin.age.countries.gb', 'Egyesült Királyság', 'United Kingdom'),
('admin.age.countries.de', 'Németország', 'Germany'),
('admin.age.summary', 'Összesítés', 'Summary'),
('admin.age.users', 'Felhasználó', 'Users'),
('admin.age.users_16_plus', 'Minden felhasználó 16 év feletti', 'All users are 16+ years old'),
('admin.age.distribution', 'Életkor szerinti megoszlás', 'Age Distribution'),
('admin.age.users_count', 'Felhasználók száma', 'User Count'),
('admin.age.ratio', 'Arányok', 'Ratios'),
('admin.age.detailed_table', 'Részletes táblázat', 'Detailed Table'),
('admin.age.age_group', 'Korosztály', 'Age Group'),
('admin.age.percentage', 'Százalék', 'Percentage'),
('admin.age.total', 'Összesen', 'Total'),
('admin.age.no_data', 'Nincs elérhető adat', 'No data available')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();