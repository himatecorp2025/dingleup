-- Add missing translation keys for admin pages (Hungarian and English)

INSERT INTO public.translations (key, hu, en) VALUES
-- AdminGameProfiles
('admin.game_profiles.title', 'Játékprofil Statisztika', 'Game Profile Statistics'),
('admin.game_profiles.subtitle', 'Játékosok profilozási adatai és személyre szabási státuszok', 'Player profiling data and personalization status'),
('admin.game_profiles.disclaimer', 'Ez a nézet a játékosok játékprofil-statisztikáit mutatja. Az adatok nem tartalmaznak érzékeny személyes adatot, és kizárólag a játékmechanika személyre szabásához és a rendszer fejlesztéséhez használjuk őket. Nem reklámcélú profilozás.', 'This view shows player game profile statistics. The data does not contain sensitive personal information and is used exclusively for game mechanics personalization and system development. Not for advertising profiling.'),
('admin.game_profiles.filter_sort', 'Szűrés és Rendezés', 'Filter and Sort'),
('admin.game_profiles.search_placeholder', 'Keresés user ID vagy felhasználónév alapján...', 'Search by user ID or username...'),
('admin.game_profiles.sort_answers', 'Válaszok száma', 'Answer Count'),
('admin.game_profiles.sort_correctness', 'Helyesség', 'Correctness'),
('admin.game_profiles.sort_active', 'Aktív AI', 'Active AI'),
('admin.game_profiles.players', 'Játékosok', 'Players'),
('admin.game_profiles.table_desc', 'Összes profil adatok és státuszok', 'All profile data and statuses'),
('admin.game_profiles.col_user', 'Felhasználó', 'User'),
('admin.game_profiles.col_total_answers', 'Összes válasz', 'Total Answers'),
('admin.game_profiles.col_correct_percent', 'Helyes %', 'Correct %'),
('admin.game_profiles.col_like_dislike', 'Like/Dislike', 'Like/Dislike'),
('admin.game_profiles.col_ai_status', 'AI Státusz', 'AI Status'),
('admin.game_profiles.col_top3', 'TOP3 Témák', 'TOP3 Topics'),
('admin.game_profiles.col_actions', 'Műveletek', 'Actions'),
('admin.game_profiles.personalization_active', 'Személyre szabás aktív (70/20/10)', 'Personalization Active (70/20/10)'),
('admin.game_profiles.learning_phase_short', 'Tanulási fázis', 'Learning Phase'),
('admin.game_profiles.ai_disabled', 'AI kikapcsolva', 'AI Disabled'),
('admin.game_profiles.view_details', 'Részletek', 'Details'),

-- MonetizationDashboard
('admin.monetization.revenue_chart', 'Bevétel (Ft)', 'Revenue (HUF)'),
('admin.monetization.purchase_count', 'Vásárlások száma', 'Purchase Count'),
('admin.monetization.paying_users', 'fizető', 'paying'),

-- PerformanceDashboard
('admin.performance.dashboard_title', 'Teljesítmény Dashboard', 'Performance Dashboard'),
('admin.performance.dashboard_subtitle', 'Az alkalmazás betöltési sebességének és hibáinak valós idejű monitorozása', 'Real-time monitoring of application load speed and errors'),
('admin.performance.refresh_button', 'Frissítés', 'Refresh'),
('admin.performance.tab_overview', 'Áttekintés', 'Overview'),
('admin.performance.tab_pages', 'Oldalak', 'Pages'),
('admin.performance.tab_devices', 'Eszközök', 'Devices'),
('admin.performance.tab_errors', 'Hibák', 'Errors'),

-- RetentionDashboard
('admin.retention.day_1', '1. Nap', 'Day 1'),
('admin.retention.day_7', '7. Nap', 'Day 7'),
('admin.retention.day_30', '30. Nap', 'Day 30')

ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();