-- Add missing translation keys for AdminGameProfileDetail table headers

INSERT INTO translations (key, hu, en) VALUES
('admin.game_profile.table.topic', 'Témakör', 'Topic'),
('admin.game_profile.table.answers', 'Válaszok', 'Answers'),
('admin.game_profile.table.correct_percent', 'Helyes %', 'Correct %'),
('admin.game_profile.table.like_dislike', 'Like/Dislike', 'Like/Dislike'),
('admin.game_profile.table.avg_time', 'Átl. idő (ms)', 'Avg. Time (ms)'),
('admin.game_profile.table.score', 'Score', 'Score'),
('admin.game_profile.table.top3', 'TOP3', 'TOP3')

ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;