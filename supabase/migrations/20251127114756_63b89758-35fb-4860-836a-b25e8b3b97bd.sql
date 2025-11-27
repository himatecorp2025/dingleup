-- Add missing AdminLayout menu translation keys
INSERT INTO public.translations (key, hu, en) VALUES
('admin.menu.all_users', 'Összes felhasználó', 'All Users'),
('admin.menu.game_profiling', 'Játékos Profilozás', 'Player Profiling'),
('admin.menu.ad_profiles', 'Reklámprofilok (Előkészítés)', 'Ad Profiles (Preparation)'),
('admin.menu.invitations', 'Meghívások', 'Invitations'),
('admin.menu.reports', 'Jelentések', 'Reports'),
('admin.menu.popular_content', 'Népszerű tartalmak', 'Popular Content'),
('admin.menu.question_pools', 'Question Pools (Kérdésbázis)', 'Question Pools (Question Database)'),
('admin.menu.booster_packages', 'Booster Csomagok', 'Booster Packages'),
('admin.menu.booster_purchases', 'Booster Vásárlások', 'Booster Purchases'),
('admin.menu.translations', 'Fordítások (UI & Kérdések)', 'Translations (UI & Questions)'),
('admin.menu.load_test', 'Terheléses Teszt (Load Test)', 'Load Test'),
('admin.menu.advanced_analytics', 'Fejlett Analitika', 'Advanced Analytics'),
('admin.menu.age_statistics', 'Korcsoport Statisztika', 'Age Group Statistics'),
('admin.menu.profile_settings', 'Profil Szerkesztése', 'Edit Profile')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;