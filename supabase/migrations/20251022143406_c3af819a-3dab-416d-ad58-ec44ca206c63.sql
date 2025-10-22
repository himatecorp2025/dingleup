-- Create activity tracking tables
CREATE TABLE IF NOT EXISTS public.user_activity_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_start timestamptz NOT NULL,
  device_class text NOT NULL CHECK (device_class IN ('mobile', 'tablet')),
  source text NOT NULL CHECK (source IN ('app_open', 'route_view', 'interaction', 'gameplay', 'purchase', 'chat')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, bucket_start)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_pings_user_bucket 
ON public.user_activity_pings(user_id, bucket_start DESC);

-- Enable RLS
ALTER TABLE public.user_activity_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity pings"
ON public.user_activity_pings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity pings"
ON public.user_activity_pings
FOR SELECT
USING (auth.uid() = user_id);

-- Create daily aggregation table
CREATE TABLE IF NOT EXISTS public.user_activity_daily (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  histogram integer[] NOT NULL DEFAULT array_fill(0, ARRAY[288]),
  top_slots jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

-- Enable RLS
ALTER TABLE public.user_activity_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily activity"
ON public.user_activity_daily
FOR SELECT
USING (auth.uid() = user_id);

-- Add promo tracking column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sub_promo_last_shown date;