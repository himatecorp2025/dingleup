-- Create global leaderboard table
CREATE TABLE IF NOT EXISTS public.global_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  total_correct_answers INTEGER NOT NULL DEFAULT 0,
  avatar_url TEXT,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.global_leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy for everyone to view leaderboard
CREATE POLICY "Anyone can view global leaderboard"
ON public.global_leaderboard
FOR SELECT
USING (true);

-- Create policy for users to update their own stats (only if they exist in profiles)
CREATE POLICY "Users can update their own leaderboard stats"
ON public.global_leaderboard
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for users to insert their own stats
CREATE POLICY "Users can insert their own leaderboard stats"
ON public.global_leaderboard
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster ranking queries
CREATE INDEX idx_global_leaderboard_rank ON public.global_leaderboard(total_correct_answers DESC);

-- Create trigger to update updated_at
CREATE TRIGGER update_global_leaderboard_updated_at
BEFORE UPDATE ON public.global_leaderboard
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add total_correct_answers to profiles table if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_correct_answers INTEGER NOT NULL DEFAULT 0;

-- Insert 50 fake users for testing leaderboard
DO $$
DECLARE
  fake_names TEXT[] := ARRAY[
    'JátékMester', 'TudásGuru', 'KvízKirály', 'AgymunkásPro', 'OkosLány',
    'LogikaMágus', 'TriviaHős', 'QuizNinja', 'KérdésBajnok', 'VálaszVadász',
    'MemóriaGép', 'TudorÁsz', 'GondolkodóGuru', 'ÉlesElme', 'ÖtletMester',
    'KvízVezér', 'TudásVadász', 'JátékosElme', 'OkosFej', 'LátóJános',
    'TriviaKirálynő', 'QuizMester', 'VálaszMester', 'KérdésKirály', 'AgymunkásPro2',
    'LogikaLegenda', 'TudásNinja', 'KvízHarcos', 'OkosOttó', 'MemóriaKing',
    'TriviaÁsz', 'QuizGuru', 'VálaszPro', 'TudósJóska', 'ÉlesLegény',
    'KvízKapitány', 'TudásTiger', 'AgymunkásAnna', 'LogikaLucy', 'TriviaTom',
    'QuizQueen', 'OkosPéter', 'MemóriaMester', 'TudásHerceg', 'VálaszViktor',
    'KérdésKatalin', 'ElmeErő', 'TriviaLegend', 'QuizBoss', 'TudásÚr'
  ];
  i INTEGER;
  fake_id UUID;
  fake_username TEXT;
  fake_score INTEGER;
BEGIN
  FOR i IN 1..50 LOOP
    fake_id := gen_random_uuid();
    fake_username := fake_names[i];
    -- Generate random scores between 50 and 500
    fake_score := 50 + floor(random() * 450)::INTEGER;
    
    -- Insert into leaderboard without foreign key constraint
    INSERT INTO public.global_leaderboard (
      id,
      user_id,
      username,
      total_correct_answers,
      avatar_url,
      created_at
    ) VALUES (
      gen_random_uuid(),
      fake_id,
      fake_username,
      fake_score,
      NULL,
      now() - (random() * interval '30 days')
    );
  END LOOP;
END;
$$;