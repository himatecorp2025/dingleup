-- Add missing admin translation keys for booster types, age statistics, and popular content
INSERT INTO translations (key, hu, en) VALUES
-- AdminBoosterTypes
('admin.boosters.title', 'Booster Csomagok', 'Booster Packages'),
('admin.boosters.types', 'típus', 'types'),
('admin.boosters.active', 'Aktív', 'Active'),
('admin.boosters.inactive', 'Inaktív', 'Inactive'),
('admin.boosters.price', 'Ár', 'Price'),
('admin.boosters.rewards', 'Jutalmak', 'Rewards'),
('admin.boosters.minutes', 'perc', 'minutes'),
('admin.boosters.code', 'Kód', 'Code'),
('admin.boosters.created', 'Létrehozva', 'Created'),
-- AdminAgeStatistics
('admin.age.title', 'Korcsoport Statisztika', 'Age Group Statistics'),
('admin.age.description', 'Felhasználók megoszlása életkor szerint', 'User distribution by age'),
('admin.age.registration_period', 'Regisztráció időszak', 'Registration Period'),
('admin.age.all', 'Összes', 'All'),
('admin.age.last_30_days', 'Elmúlt 30 nap', 'Last 30 days'),
('admin.age.last_90_days', 'Elmúlt 90 nap', 'Last 90 days'),
('admin.age.last_1_year', 'Elmúlt 1 év', 'Last 1 year'),
('admin.age.country', 'Ország', 'Country'),
('admin.age.all_countries', 'Összes ország', 'All countries'),
('admin.age.summary', 'Összesítés', 'Summary'),
('admin.age.users', 'felhasználó', 'users'),
('admin.age.users_16_plus', '16 éves vagy idősebb felhasználók száma', 'Number of users 16 years or older'),
('admin.age.distribution', 'Korcsoportok eloszlása', 'Age Group Distribution'),
('admin.age.users_count', 'Felhasználók száma', 'Number of Users'),
('admin.age.ratio', 'Korcsoportok aránya', 'Age Group Ratio'),
('admin.age.detailed_table', 'Részletes táblázat', 'Detailed Table'),
('admin.age.age_group', 'Korcsoport', 'Age Group'),
('admin.age.percentage', 'Arány (%)', 'Percentage (%)'),
('admin.age.total', 'Összesen', 'Total'),
('admin.age.no_data', 'Nincs megjeleníthető adat', 'No data to display'),
-- AdminPopularContent
('admin.popular.load_error', 'Nem sikerült betölteni a népszerű tartalmakat. Kérlek, próbáld meg később újra.', 'Failed to load popular content. Please try again later.'),
('admin.popular.title', 'Népszerű tartalmak', 'Popular Content'),
('admin.popular.retry', 'Újrapróbálás', 'Retry'),
('admin.popular.topic', 'Témakör', 'Topic'),
('admin.popular.total_likes', 'Összes lájk', 'Total Likes'),
('admin.popular.total_dislikes', 'Összes dislike', 'Total Dislikes'),
('admin.popular.net_score', 'Netto népszerűség', 'Net Popularity')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;