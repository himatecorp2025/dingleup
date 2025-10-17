-- Extend profiles table with game data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lives INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS max_lives INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS lives_regeneration_rate INTEGER DEFAULT 12, -- minutes per life
ADD COLUMN IF NOT EXISTS last_life_regeneration TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS speed_booster_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS speed_booster_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS speed_booster_multiplier INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS help_50_50_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS help_2x_answer_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS help_audience_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS daily_gift_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_gift_last_claimed TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_code TEXT UNIQUE;

-- Create game_results table
CREATE TABLE IF NOT EXISTS public.game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, -- 'health', 'history', 'culture', 'finance'
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 15,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  average_response_time DECIMAL(10, 2), -- in seconds
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weekly_rankings table
CREATE TABLE IF NOT EXISTS public.weekly_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  week_start DATE NOT NULL,
  total_correct_answers INTEGER DEFAULT 0,
  average_response_time DECIMAL(10, 2),
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, week_start)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invited_email TEXT,
  invited_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invitation_code TEXT NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_results
CREATE POLICY "Users can view their own game results"
ON public.game_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game results"
ON public.game_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for weekly_rankings
CREATE POLICY "Anyone can view weekly rankings"
ON public.weekly_rankings FOR SELECT
USING (true);

CREATE POLICY "System can update weekly rankings"
ON public.weekly_rankings FOR ALL
USING (true);

-- RLS Policies for invitations
CREATE POLICY "Users can view their own invitations"
ON public.invitations FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invited_user_id);

CREATE POLICY "Users can create invitations"
ON public.invitations FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

-- Function to generate unique invitation code
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE invitation_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Trigger to set invitation code on profile creation
CREATE OR REPLACE FUNCTION public.set_invitation_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invitation_code IS NULL THEN
    NEW.invitation_code := generate_invitation_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invitation_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_invitation_code();

-- Update existing profiles to have invitation codes
UPDATE public.profiles
SET invitation_code = generate_invitation_code()
WHERE invitation_code IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_results_user_category ON public.game_results(user_id, category);
CREATE INDEX IF NOT EXISTS idx_game_results_created_at ON public.game_results(created_at);
CREATE INDEX IF NOT EXISTS idx_weekly_rankings_week_category ON public.weekly_rankings(week_start, category, rank);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(invitation_code);