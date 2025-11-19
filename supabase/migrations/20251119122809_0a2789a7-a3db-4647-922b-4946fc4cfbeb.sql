-- Booster rendszer táblák létrehozása

-- 1. booster_types - booster definíciók
CREATE TABLE IF NOT EXISTS public.booster_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  
  -- árak
  price_gold integer,
  price_usd_cents integer,
  
  -- jutalmak
  reward_gold integer NOT NULL DEFAULT 0,
  reward_lives integer NOT NULL DEFAULT 0,
  reward_speed_count integer NOT NULL DEFAULT 0,
  reward_speed_duration_min integer NOT NULL DEFAULT 0,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. booster_purchases - vásárlási napló
CREATE TABLE IF NOT EXISTS public.booster_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booster_type_id uuid NOT NULL REFERENCES public.booster_types(id),
  purchase_source text NOT NULL CHECK (purchase_source IN ('GOLD', 'IAP')),
  gold_spent integer NOT NULL DEFAULT 0,
  usd_cents_spent integer NOT NULL DEFAULT 0,
  iap_transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. user_purchase_settings - azonnali vásárlás engedélyezés
CREATE TABLE IF NOT EXISTS public.user_purchase_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  instant_premium_booster_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. user_premium_booster_state - pending premium állapot
CREATE TABLE IF NOT EXISTS public.user_premium_booster_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_pending_premium_booster boolean NOT NULL DEFAULT false,
  last_premium_purchase_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexek teljesítményhez
CREATE INDEX IF NOT EXISTS idx_booster_purchases_user_id ON public.booster_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_booster_purchases_created_at ON public.booster_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booster_purchases_source ON public.booster_purchases(purchase_source);

-- RLS policies
ALTER TABLE public.booster_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booster_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchase_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_premium_booster_state ENABLE ROW LEVEL SECURITY;

-- booster_types - mindenki olvashatja az aktív típusokat
CREATE POLICY "Anyone can view active booster types"
  ON public.booster_types FOR SELECT
  USING (is_active = true);

-- booster_purchases - csak saját vásárlásokat láthatja
CREATE POLICY "Users can view own purchases"
  ON public.booster_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON public.booster_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_purchase_settings - csak saját beállításokat
CREATE POLICY "Users can view own settings"
  ON public.user_purchase_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_purchase_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_purchase_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_premium_booster_state - csak saját állapot
CREATE POLICY "Users can view own booster state"
  ON public.user_premium_booster_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own booster state"
  ON public.user_premium_booster_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own booster state"
  ON public.user_premium_booster_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all booster purchases"
  ON public.booster_purchases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage booster types"
  ON public.booster_types FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Adatok feltöltése: FREE és PREMIUM booster definíciók
INSERT INTO public.booster_types (code, name, description, price_gold, price_usd_cents, reward_gold, reward_lives, reward_speed_count, reward_speed_duration_min)
VALUES 
  ('FREE', 'Free Booster', 'Aranyért vásárolható booster csomag', 900, NULL, 300, 15, 4, 30),
  ('PREMIUM', 'Premium Booster', 'Prémium booster csomag azonnali vásárlással', NULL, 299, 1500, 50, 24, 60)
ON CONFLICT (code) DO NOTHING;