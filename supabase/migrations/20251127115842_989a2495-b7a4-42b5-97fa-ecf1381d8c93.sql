-- Add translation keys for User Journey funnel steps
INSERT INTO public.translations (key, hu, en) VALUES
-- Onboarding Funnel
('journey.funnel.registration', 'Regisztráció', 'Registration'),
('journey.funnel.dashboard_visit', 'Dashboard látogatás', 'Dashboard Visit'),
('journey.funnel.first_game', 'Első játék', 'First Game'),
('journey.funnel.first_purchase', 'Első vásárlás', 'First Purchase'),

-- Purchase Funnel
('journey.funnel.product_view', 'Termék megtekintés', 'Product View'),
('journey.funnel.add_to_cart', 'Kosárba helyezés', 'Add to Cart'),
('journey.funnel.purchase', 'Vásárlás', 'Purchase'),

-- Game Funnel
('journey.funnel.game_start', 'Játék kezdés', 'Game Start'),
('journey.funnel.question_5', '5. kérdés elérése', 'Question 5 Reached'),
('journey.funnel.question_10', '10. kérdés elérése', 'Question 10 Reached'),
('journey.funnel.game_complete', 'Játék befejezés', 'Game Complete')

ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en,
  updated_at = NOW();