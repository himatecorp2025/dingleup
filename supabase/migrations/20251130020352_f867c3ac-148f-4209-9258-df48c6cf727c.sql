-- Add username, avatar_url, and total_correct_answers to daily_winner_awarded table
ALTER TABLE public.daily_winner_awarded 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS total_correct_answers INTEGER DEFAULT 0;