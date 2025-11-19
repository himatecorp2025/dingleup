-- Create user_purchase_settings table
CREATE TABLE IF NOT EXISTS public.user_purchase_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  instant_premium_booster_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_premium_booster_state table
CREATE TABLE IF NOT EXISTS public.user_premium_booster_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_pending_premium_booster boolean NOT NULL DEFAULT false,
  last_premium_purchase_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_purchase_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_premium_booster_state ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_purchase_settings
CREATE POLICY "Users can view their own purchase settings"
  ON public.user_purchase_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase settings"
  ON public.user_purchase_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase settings"
  ON public.user_purchase_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_premium_booster_state
CREATE POLICY "Users can view their own premium booster state"
  ON public.user_premium_booster_state
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage premium booster state"
  ON public.user_premium_booster_state
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert or update booster types with correct prices
INSERT INTO public.booster_types (code, name, description, price_gold, price_usd_cents, reward_gold, reward_lives, reward_speed_count, reward_speed_duration_min, is_active)
VALUES 
  ('FREE', 'Free Booster', '900 aranyért Free Booster, amely +300 aranyat, +15 életet és 4× 30 perces Speed Boostert ad.', 900, NULL, 300, 15, 4, 30, true),
  ('PREMIUM', 'Premium Speed Booster', 'Premium Speed Booster 2,49 USD-ért, amely +1500 aranyat, +50 életet és 24× 60 perces Speed Boostert ad.', NULL, 249, 1500, 50, 24, 60, true)
ON CONFLICT (code) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_gold = EXCLUDED.price_gold,
  price_usd_cents = EXCLUDED.price_usd_cents,
  reward_gold = EXCLUDED.reward_gold,
  reward_lives = EXCLUDED.reward_lives,
  reward_speed_count = EXCLUDED.reward_speed_count,
  reward_speed_duration_min = EXCLUDED.reward_speed_duration_min,
  is_active = EXCLUDED.is_active,
  updated_at = now();