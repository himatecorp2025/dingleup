-- Weekly login reward system tables
CREATE TABLE IF NOT EXISTS public.weekly_login_rewards (
  reward_index INTEGER PRIMARY KEY,
  gold_amount INTEGER NOT NULL,
  lives_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default weekly login reward values
INSERT INTO public.weekly_login_rewards (reward_index, gold_amount, lives_bonus) VALUES
(1, 50, 0),
(2, 75, 0),
(3, 110, 0),
(4, 160, 0),
(5, 220, 0),
(6, 300, 0),
(7, 500, 0)
ON CONFLICT (reward_index) DO NOTHING;

-- Weekly login state tracking
CREATE TABLE IF NOT EXISTS public.weekly_login_state (
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  awarded_login_index INTEGER DEFAULT 0,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_login_state ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_login_state
CREATE POLICY "Users can view their own login state"
ON public.weekly_login_state FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all login states"
ON public.weekly_login_state FOR ALL
USING (auth.role() = 'service_role');

-- Lives ledger for life transactions
CREATE TABLE IF NOT EXISTS public.lives_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  delta_lives INTEGER NOT NULL,
  source TEXT NOT NULL,
  correlation_id TEXT UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lives_ledger ENABLE ROW LEVEL SECURITY;

-- RLS policies for lives_ledger
CREATE POLICY "Users can view their own lives ledger"
ON public.lives_ledger FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all lives ledger"
ON public.lives_ledger FOR ALL
USING (auth.role() = 'service_role');

-- Weekly leaderboard snapshot
CREATE TABLE IF NOT EXISTS public.weekly_leaderboard_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  rank INTEGER NOT NULL,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(week_start, user_id)
);

-- Enable RLS
ALTER TABLE public.weekly_leaderboard_snapshot ENABLE ROW LEVEL SECURITY;

-- RLS policies for leaderboard snapshot
CREATE POLICY "Anyone can view leaderboard snapshots"
ON public.weekly_leaderboard_snapshot FOR SELECT
USING (true);

CREATE POLICY "Service role can manage leaderboard snapshots"
ON public.weekly_leaderboard_snapshot FOR ALL
USING (auth.role() = 'service_role');

-- Weekly prize table configuration
CREATE TABLE IF NOT EXISTS public.weekly_prize_table (
  rank INTEGER PRIMARY KEY,
  gold INTEGER NOT NULL,
  lives INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default prize values for Top 10
INSERT INTO public.weekly_prize_table (rank, gold, lives) VALUES
(1, 5000, 100),
(2, 2500, 50),
(3, 1500, 30),
(4, 1000, 20),
(5, 800, 15),
(6, 700, 10),
(7, 600, 10),
(8, 500, 8),
(9, 500, 6),
(10, 500, 5)
ON CONFLICT (rank) DO NOTHING;

-- Weekly winner awarded tracking
CREATE TABLE IF NOT EXISTS public.weekly_winner_awarded (
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  rank INTEGER NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_winner_awarded ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_winner_awarded
CREATE POLICY "Users can view their own awards"
ON public.weekly_winner_awarded FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage awards"
ON public.weekly_winner_awarded FOR ALL
USING (auth.role() = 'service_role');

-- Weekly winner popup shown tracking
CREATE TABLE IF NOT EXISTS public.weekly_winner_popup_shown (
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_winner_popup_shown ENABLE ROW LEVEL SECURITY;

-- RLS policies for popup tracking
CREATE POLICY "Users can view their own popup state"
ON public.weekly_winner_popup_shown FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own popup state"
ON public.weekly_winner_popup_shown FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Coin ledger rename existing wallet_ledger columns for consistency
-- (wallet_ledger already exists and handles coins, so we'll use it)

-- Function to credit lives idempotently
CREATE OR REPLACE FUNCTION public.credit_lives(
  p_user_id uuid,
  p_delta_lives integer,
  p_source text,
  p_idempotency_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_current_lives integer;
  v_max_lives integer;
  v_new_lives integer;
BEGIN
  IF EXISTS (SELECT 1 FROM public.lives_ledger WHERE correlation_id = p_idempotency_key) THEN
    RETURN json_build_object('success', true, 'already_processed', true);
  END IF;

  SELECT lives, max_lives INTO v_current_lives, v_max_lives
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  IF (v_current_lives + p_delta_lives) < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient lives');
  END IF;

  v_new_lives := v_current_lives + p_delta_lives;

  INSERT INTO public.lives_ledger (
    user_id, delta_lives, source, correlation_id, metadata
  ) VALUES (
    p_user_id, p_delta_lives, p_source, p_idempotency_key, p_metadata
  );

  UPDATE public.profiles
  SET 
    lives = v_new_lives,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'new_lives', v_new_lives
  );
END;
$function$;

-- Function to get current week start (Europe/Budapest timezone)
CREATE OR REPLACE FUNCTION public.get_current_week_start()
RETURNS DATE
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  now_budapest TIMESTAMP WITH TIME ZONE;
  week_start DATE;
BEGIN
  -- Get current time in Europe/Budapest timezone
  now_budapest := now() AT TIME ZONE 'Europe/Budapest';
  
  -- Calculate Monday of current week
  week_start := DATE(now_budapest - (EXTRACT(DOW FROM now_budapest)::INTEGER - 1) * INTERVAL '1 day');
  
  -- If Sunday (DOW = 0), go back to previous Monday
  IF EXTRACT(DOW FROM now_budapest) = 0 THEN
    week_start := week_start - INTERVAL '6 days';
  END IF;
  
  RETURN week_start;
END;
$function$;