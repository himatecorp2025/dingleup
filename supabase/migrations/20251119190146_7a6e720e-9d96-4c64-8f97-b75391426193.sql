-- Create daily_rankings table (parallel to weekly_rankings)
CREATE TABLE IF NOT EXISTS public.daily_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'mixed',
  day_date DATE NOT NULL,
  total_correct_answers INTEGER NOT NULL DEFAULT 0,
  average_response_time NUMERIC(10,2) DEFAULT 0.00,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT daily_rankings_unique UNIQUE (user_id, category, day_date)
);

-- Create indexes for daily_rankings
CREATE INDEX IF NOT EXISTS idx_daily_rankings_day_category ON public.daily_rankings(day_date, category);
CREATE INDEX IF NOT EXISTS idx_daily_rankings_user_day ON public.daily_rankings(user_id, day_date);
CREATE INDEX IF NOT EXISTS idx_daily_rankings_rank ON public.daily_rankings(rank) WHERE rank IS NOT NULL;

-- Enable RLS on daily_rankings
ALTER TABLE public.daily_rankings ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_rankings (everyone can read, only system can write)
CREATE POLICY "Daily rankings are viewable by everyone"
  ON public.daily_rankings FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert daily rankings"
  ON public.daily_rankings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update their daily rankings"
  ON public.daily_rankings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create daily_prize_table (parallel to weekly prizes but for daily rewards)
CREATE TABLE IF NOT EXISTS public.daily_prize_table (
  rank INTEGER PRIMARY KEY,
  gold INTEGER NOT NULL DEFAULT 0,
  lives INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default daily prizes (same as weekly for now, will be customized later)
INSERT INTO public.daily_prize_table (rank, gold, lives) VALUES
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

-- Enable RLS on daily_prize_table
ALTER TABLE public.daily_prize_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily prizes are viewable by everyone"
  ON public.daily_prize_table FOR SELECT
  USING (true);

-- Create daily_winner_awarded table (tracks who received daily prizes)
CREATE TABLE IF NOT EXISTS public.daily_winner_awarded (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rank INTEGER NOT NULL,
  day_date DATE NOT NULL,
  gold_awarded INTEGER NOT NULL DEFAULT 0,
  lives_awarded INTEGER NOT NULL DEFAULT 0,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT daily_winner_awarded_unique UNIQUE (user_id, day_date)
);

-- Create index for daily_winner_awarded
CREATE INDEX IF NOT EXISTS idx_daily_winner_awarded_day ON public.daily_winner_awarded(day_date);
CREATE INDEX IF NOT EXISTS idx_daily_winner_awarded_user ON public.daily_winner_awarded(user_id);

-- Enable RLS on daily_winner_awarded
ALTER TABLE public.daily_winner_awarded ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily winners are viewable by everyone"
  ON public.daily_winner_awarded FOR SELECT
  USING (true);

-- Create daily_leaderboard_snapshot table (stores historical daily TOP 10)
CREATE TABLE IF NOT EXISTS public.daily_leaderboard_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  rank INTEGER NOT NULL,
  total_correct_answers INTEGER NOT NULL DEFAULT 0,
  country_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT daily_leaderboard_snapshot_unique UNIQUE (snapshot_date, user_id, country_code)
);

-- Create indexes for daily_leaderboard_snapshot
CREATE INDEX IF NOT EXISTS idx_daily_snapshot_date ON public.daily_leaderboard_snapshot(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_daily_snapshot_country ON public.daily_leaderboard_snapshot(snapshot_date, country_code);

-- Enable RLS on daily_leaderboard_snapshot
ALTER TABLE public.daily_leaderboard_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily leaderboard snapshots are viewable by everyone"
  ON public.daily_leaderboard_snapshot FOR SELECT
  USING (true);

-- Create daily_winner_popup_shown table (tracks popup dismissals)
CREATE TABLE IF NOT EXISTS public.daily_winner_popup_shown (
  user_id UUID NOT NULL,
  day_date DATE NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, day_date)
);

-- Enable RLS on daily_winner_popup_shown
ALTER TABLE public.daily_winner_popup_shown ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own popup status"
  ON public.daily_winner_popup_shown FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own popup status"
  ON public.daily_winner_popup_shown FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Initialize today's daily_rankings for all users
INSERT INTO public.daily_rankings (user_id, category, day_date, total_correct_answers, average_response_time)
SELECT 
  id,
  'mixed',
  CURRENT_DATE,
  0,
  0.00
FROM public.profiles
ON CONFLICT (user_id, category, day_date) DO NOTHING;

-- Create function to get current day start
CREATE OR REPLACE FUNCTION public.get_current_day_date()
RETURNS DATE
LANGUAGE SQL
STABLE
AS $$
  SELECT CURRENT_DATE;
$$;

-- Create function to update daily ranking for user (similar to weekly)
CREATE OR REPLACE FUNCTION public.update_daily_ranking_for_user(
  p_user_id UUID,
  p_correct_answers INTEGER,
  p_average_response_time NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_day_date DATE;
BEGIN
  v_day_date := get_current_day_date();
  
  INSERT INTO daily_rankings (user_id, category, day_date, total_correct_answers, average_response_time)
  VALUES (p_user_id, 'mixed', v_day_date, p_correct_answers, p_average_response_time)
  ON CONFLICT (user_id, category, day_date)
  DO UPDATE SET
    total_correct_answers = daily_rankings.total_correct_answers + EXCLUDED.total_correct_answers,
    average_response_time = (
      (daily_rankings.average_response_time * daily_rankings.total_correct_answers) + 
      (EXCLUDED.average_response_time * EXCLUDED.total_correct_answers)
    ) / (daily_rankings.total_correct_answers + EXCLUDED.total_correct_answers);
    
  -- Update ranks for all users on this day
  WITH ranked_users AS (
    SELECT 
      user_id, 
      category, 
      day_date, 
      ROW_NUMBER() OVER (
        PARTITION BY category, day_date 
        ORDER BY total_correct_answers DESC, average_response_time ASC
      ) as new_rank
    FROM daily_rankings 
    WHERE day_date = v_day_date AND category = 'mixed'
  )
  UPDATE daily_rankings dr 
  SET rank = ru.new_rank 
  FROM ranked_users ru 
  WHERE dr.user_id = ru.user_id 
    AND dr.category = ru.category 
    AND dr.day_date = ru.day_date;
END;
$$;

-- Enable realtime for daily_rankings
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_rankings;