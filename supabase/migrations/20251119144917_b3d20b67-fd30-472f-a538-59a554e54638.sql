-- Add purchase_context column to booster_purchases if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'booster_purchases' 
    AND column_name = 'purchase_context'
  ) THEN
    ALTER TABLE public.booster_purchases
      ADD COLUMN purchase_context text;
  END IF;
END $$;

-- Insert new in-game booster types (GOLD_SAVER and INSTANT_RESCUE)
INSERT INTO public.booster_types
  (code, name, description, is_active,
   price_gold, price_usd_cents,
   reward_gold, reward_lives,
   reward_speed_count, reward_speed_duration_min)
VALUES
  ('GOLD_SAVER', 'Gold Saver Booster', 'In-game arany booster, 500→250 gold + 15 élet, Speed nélkül', true,
   500, NULL,
   250, 15,
   0, 0),
  ('INSTANT_RESCUE', 'Instant Rescue Booster', 'In-game IAP booster, 1000 gold + 25 élet, Speed nélkül', true,
   NULL, 149,  -- 1.49 USD (149 cent)
   1000, 25,
   0, 0)
ON CONFLICT (code) DO NOTHING;