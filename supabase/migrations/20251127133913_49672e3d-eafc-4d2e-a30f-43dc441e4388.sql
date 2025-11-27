-- Add translations for Gifts page
INSERT INTO translations (key, hu, en) VALUES
  ('gifts.title', 'Ajándékaim', 'My Rewards'),
  ('gifts.my_boxes', 'Megszerzett ajándékaim', 'My Reward Boxes'),
  ('gifts.get_new', 'Új ajándékok megszerzése', 'Get New Rewards'),
  ('gifts.box_singular', 'box', 'box'),
  ('gifts.box_plural', 'boxes', 'boxes'),
  ('gifts.random_rewards', 'Random arany + életek', 'Random Gold + Hearts'),
  ('gifts.inactive', 'Inaktív', 'Inactive'),
  ('gifts.buy', 'Vásárlás', 'Buy Now')
ON CONFLICT (key) DO UPDATE 
SET hu = EXCLUDED.hu, en = EXCLUDED.en;