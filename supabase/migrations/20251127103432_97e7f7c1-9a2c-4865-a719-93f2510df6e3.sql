-- Add missing translation keys for About and Dashboard pages
INSERT INTO translations (key, hu, en) VALUES
  ('about.admin_button', 'Admin Felület', 'Admin Panel'),
  ('errors.activation_failed', 'Aktiválási hiba', 'Activation error'),
  ('errors.payment_failed', 'Fizetési hiba', 'Payment error')
ON CONFLICT (key) DO UPDATE SET
  hu = EXCLUDED.hu,
  en = EXCLUDED.en;