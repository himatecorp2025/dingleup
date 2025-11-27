-- Add missing i18n keys for bilingual completion (hu + en only)

INSERT INTO translations (key, hu, en) VALUES
-- AdminLayout keys
('admin.layout.admin_panel', 'Admin Panel', 'Admin Panel'),
('admin.layout.main_menu', 'Főmenü', 'Main Menu'),
('admin.layout.back_to_game', 'Vissza a játékba', 'Back to Game'),
('admin.layout.logout', 'Kijelentkezés', 'Logout'),

-- QuestionTranslationManager keys
('admin.question_translations.title', 'Kérdés Fordítások', 'Question Translations'),
('admin.question_translations.description', 'AI-alapú automatikus fordítás generálása mind a 7 támogatott nyelvre (angol, német, francia, spanyol, olasz, portugál, holland).', 'AI-powered automatic translation generation for all 7 supported languages (English, German, French, Spanish, Italian, Portuguese, Dutch).'),
('admin.question_translations.total_questions', 'Összes kérdés', 'Total Questions'),
('admin.question_translations.total_answers', 'Összes válasz', 'Total Answers'),
('admin.question_translations.progress', 'Folyamat', 'Progress'),
('admin.question_translations.total', 'Összesen', 'Total'),
('admin.question_translations.errors', 'Hibák', 'Errors'),
('admin.question_translations.checking_content', 'Tartalom ellenőrzése...', 'Checking content...'),
('admin.question_translations.translating', 'Fordítás folyamatban...', 'Translating...'),
('admin.question_translations.generate_missing', 'Hiányzó fordítások generálása', 'Generate Missing Translations'),
('admin.question_translations.current_language', 'Aktuális nyelv', 'Current Language'),

-- TranslationSeeder keys  
('admin.ui_translations.title', 'UI Fordítások', 'UI Translations'),
('admin.ui_translations.description', 'AI-alapú automatikus fordítás generálása az összes UI szövegre mind a 7 támogatott nyelvre (angol, német, francia, spanyol, olasz, portugál, holland).', 'AI-powered automatic translation generation for all UI texts in all 7 supported languages (English, German, French, Spanish, Italian, Portuguese, Dutch).'),
('admin.ui_translations.total_keys', 'Összes kulcs', 'Total Keys'),
('admin.ui_translations.progress', 'Folyamat', 'Progress'),
('admin.ui_translations.total', 'Összesen', 'Total'),
('admin.ui_translations.successful', 'Sikeres', 'Successful'),
('admin.ui_translations.errors', 'Hibák', 'Errors'),

-- ProfileGame keys
('profile_game.title', 'Játékprofilom', 'My Game Profile'),
('profile_game.subtitle', 'Személyre szabott kérdéssor és statisztikák', 'Personalized questions and statistics'),
('profile_game.legal_info', 'A játékprofil kizárólag a játékélmény személyre szabására szolgál. Nem tartalmaz érzékeny adatot, nem reklámprofil, és bármikor kikapcsolhatod. A személyre szabás csak akkor aktiválódik, ha több mint 1000 kérdést megválaszoltál.', 'The game profile is exclusively for personalizing the game experience. It does not contain sensitive data, is not an advertising profile, and can be disabled at any time. Personalization only activates after answering more than 1000 questions.'),
('profile_game.learning_phase', 'Tanulási fázis', 'Learning Phase'),
('profile_game.learning_phase_desc', 'A rendszer még tanulja a játékstílusodat. {count} kérdés szükséges még a személyre szabott kérdéssor aktiválásához.', 'The system is still learning your playing style. {count} more questions are needed to activate personalized questions.'),
('profile_game.personalization_active', 'Személyre szabás aktív', 'Personalization Active'),
('profile_game.personalization_active_desc', 'A kérdések 70%-a a kedvenc témáidból érkezik.', '70% of questions come from your favorite topics.'),
('profile_game.ai_personalization', 'AI Személyre Szabás', 'AI Personalization'),
('profile_game.enable_personalized', 'Személyre szabott kérdéssor engedélyezése', 'Enable personalized questions'),
('profile_game.stats.total_answers', 'Összes válasz', 'Total Answers'),
('profile_game.stats.correct_answers', 'Helyes válaszok', 'Correct Answers'),
('profile_game.stats.correct_ratio', 'Helyességi arány', 'Correct Ratio'),
('profile_game.top3_topics', 'TOP 3 Témakörök', 'TOP 3 Topics'),
('profile_game.top3_desc', 'A kedvenc témáid, amelyekből a legtöbb kérdés érkezik', 'Your favorite topics from which most questions come'),
('profile_game.question_distribution', 'Kérdéselosztás (70/20/10)', 'Question Distribution (70/20/10)'),
('profile_game.distribution_desc', 'Személyre szabott kérdéssor megoszlása', 'Personalized question distribution'),
('profile_game.favorite_topics', 'Kedvenc témák (TOP3)', 'Favorite Topics (TOP3)'),
('profile_game.new_questions', 'Új kérdések', 'New Questions'),
('profile_game.dislike_topics', 'Dislike témák', 'Dislike Topics'),
('profile_game.all_topics', 'Összes Témakör', 'All Topics'),
('profile_game.all_topics_desc', 'Teljes statisztika témánként', 'Complete statistics by topic'),
('profile_game.table.topic', 'Témakör', 'Topic'),
('profile_game.table.answers', 'Válaszok', 'Answers'),
('profile_game.table.correct_percent', 'Helyes %', 'Correct %'),
('profile_game.table.like_dislike', 'Like/Dislike', 'Like/Dislike'),
('profile_game.table.score', 'Pontszám', 'Score'),
('profile_game.table.top3', 'TOP3', 'TOP3'),
('profile_game.answers_count', '{count} válasz', '{count} answers'),
('profile_game.correct_percentage', '{percent}% helyes', '{percent}% correct'),

-- UserGrowthChart keys
('admin.chart.users_spending_trend', 'Felhasználók & Költés Trend', 'Users & Spending Trend'),
('admin.chart.users_spending_30days', 'Felhasználók & Költés Trend (30 nap)', 'Users & Spending Trend (30 days)'),
('admin.chart.current_users', 'Jelenlegi felhasználók', 'Current Users'),
('admin.chart.avg_spend_per_user', 'Átlag költés/fő', 'Avg Spend/User'),
('admin.chart.all_users_label', 'Összes felhasználó', 'All Users'),
('admin.chart.avg_spend_label', 'Átlag költés/fő ($)', 'Avg Spend/User ($)'),
('admin.chart.users_axis', 'Felhasználók', 'Users'),
('admin.chart.avg_spend_axis', 'Átlag költés ($)', 'Avg Spend ($)'),

-- ScreenshotProtection keys
('screenshot_protection.protected_content', 'Védett tartalom', 'Protected Content'),
('screenshot_protection.return_to_app', 'Térj vissza az alkalmazáshoz a folytatáshoz', 'Return to the app to continue'),

-- ASZF & Adatkezeles keys
('legal.aszf.title', 'Általános Szerződési Feltételek', 'Terms and Conditions'),
('legal.aszf.content', 'DingleUP! - ÁSZF tartalom (placeholder)', 'DingleUP! - Terms content (placeholder)'),
('legal.adatkezeles.title', 'Adatkezelési Tájékoztató', 'Privacy Policy'),
('legal.adatkezeles.content', 'DingleUP! - Adatkezelési tájékoztató (placeholder)', 'DingleUP! - Privacy policy (placeholder)')

ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();