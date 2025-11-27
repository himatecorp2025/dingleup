-- Add missing translation keys for DailyWinnersDialog
INSERT INTO translations (key, hu, en) VALUES
  ('dailyWinners.dialog_title', 'Tegnapi Nyertesek', 'Yesterday''s Winners'),
  ('dailyWinners.dialog_description', 'TOP 10 tegnapi nyertesek listája', 'TOP 10 yesterday''s winners list')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;