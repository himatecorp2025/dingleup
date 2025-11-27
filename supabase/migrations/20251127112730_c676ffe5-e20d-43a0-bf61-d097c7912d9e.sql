-- Add translation keys for remaining admin pages

-- AdminPopularContent
INSERT INTO translations (key, hu, en) VALUES
('admin.popular.session_error', 'Nincs adminisztrátori munkamenet', 'No admin session');

-- AdminAgeStatistics
INSERT INTO translations (key, hu, en) VALUES
('admin.age.countries.hu', 'Magyarország', 'Hungary'),
('admin.age.countries.us', 'USA', 'USA'),
('admin.age.countries.gb', 'Egyesült Királyság', 'United Kingdom'),
('admin.age.countries.de', 'Németország', 'Germany'),
('admin.age.tooltip_count', '{value} fő', '{value} users');

-- AdminQuestionPools  
INSERT INTO translations (key, hu, en) VALUES
('admin.pools.main_title', 'Question Pools (Vegyes Témák)', 'Question Pools (Mixed Topics)'),
('admin.pools.subtitle', '50 pool összesen × 270 kérdés/pool (27 témakör × 10 kérdés) → cél: 500 kérdés (50 témakör)', '50 pools total × 270 questions/pool (27 topics × 10 questions) → target: 500 questions (50 topics)'),
('admin.pools.card_title', 'Globális Pool Rendszer', 'Global Pool System'),
('admin.pools.card_description', '50 pool vegyes témákkal. Rotáció: 1→2→3→...→50→1 (minden játékos más poolból kap)', '50 pools with mixed topics. Rotation: 1→2→3→...→50→1 (each player gets different pool)'),
('admin.pools.stat_active', 'Aktív Poolok', 'Active Pools'),
('admin.pools.stat_total_questions', 'Összes Kérdés', 'Total Questions'),
('admin.pools.stat_avg_per_pool', 'Átlag/Pool', 'Avg/Pool'),
('admin.pools.stat_min_per_pool', 'Min/Pool', 'Min/Pool'),
('admin.pools.stat_max_per_pool', 'Max/Pool', 'Max/Pool'),
('admin.pools.warning_low_questions', '⚠️ Néhány pool kevés kérdést tartalmaz (<15) - ezek átugrásra kerülnek', '⚠️ Some pools contain few questions (<15) - these will be skipped'),
('admin.pools.optimized_title', 'Vegyes Pool Rendszer (25.000 játékosra optimalizálva)', 'Mixed Pool System (Optimized for 25,000 players)'),
('admin.pools.feature_1', '✅ 50 pool ÖSSZESEN (nem témakörönként!)', '✅ 50 pools TOTAL (not per topic!)'),
('admin.pools.feature_2', '✅ Minden pool minden témakörből pontosan 10 kérdést tartalmaz', '✅ Every pool contains exactly 10 questions from each topic'),
('admin.pools.feature_3', '✅ Jelenleg: 27 témakör × 10 kérdés = 270 kérdés/pool', '✅ Currently: 27 topics × 10 questions = 270 questions/pool'),
('admin.pools.feature_4', '✅ Cél: 50 témakör × 10 kérdés = 500 kérdés/pool', '✅ Target: 50 topics × 10 questions = 500 questions/pool'),
('admin.pools.feature_5', '✅ Pool-rotáció: 1→2→3→...→50→1 (soha nem ugyanaz kétszer egymás után)', '✅ Pool rotation: 1→2→3→...→50→1 (never the same twice in a row)'),
('admin.pools.feature_6', '✅ Poolok memóriában cache-eltek → 25.000 egyidejű játékos támogatás', '✅ Pools cached in memory → 25,000 concurrent player support'),
('admin.pools.feature_7', '✅ Kis poolok (<15 kérdés) automatikusan átugrásra kerülnek', '✅ Small pools (<15 questions) are automatically skipped'),
('admin.pools.feature_8', '✅ Új kérdések hozzáadása után újragenerálással frissíthetők', '✅ Can be refreshed by regeneration after adding new questions');

-- AdvancedAnalytics
INSERT INTO translations (key, hu, en) VALUES
('admin.advanced.title', 'Fejlett Analitika', 'Advanced Analytics'),
('admin.advanced.retention_title', 'Retenciós Dashboard', 'Retention Dashboard'),
('admin.advanced.retention_desc', 'DAU/WAU/MAU, kohorsz analízis, lemorzsolódás', 'DAU/WAU/MAU, cohort analysis, churn'),
('admin.advanced.monetization_title', 'Monetizációs Dashboard', 'Monetization Dashboard'),
('admin.advanced.monetization_desc', 'Bevétel, ARPU, konverzió, LTV analízis', 'Revenue, ARPU, conversion, LTV analysis'),
('admin.advanced.performance_title', 'Teljesítmény Dashboard', 'Performance Dashboard'),
('admin.advanced.performance_desc', 'Betöltési idők, TTFB, LCP, hibák', 'Load times, TTFB, LCP, errors'),
('admin.advanced.engagement_title', 'Engagement Dashboard', 'Engagement Dashboard'),
('admin.advanced.engagement_desc', 'Session-ök, felhasználói aktivitás, játék engagement', 'Sessions, user activity, game engagement'),
('admin.advanced.journey_title', 'User Journey', 'User Journey'),
('admin.advanced.journey_desc', 'Onboarding, vásárlási és játék tölcsérek', 'Onboarding, purchase and game funnels');
