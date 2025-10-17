-- Add welcome bonus tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS welcome_bonus_claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS question_swaps_available INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN profiles.welcome_bonus_claimed IS 'Tracks if user has claimed their one-time welcome bonus of 2500 coins';
COMMENT ON COLUMN profiles.question_swaps_available IS 'Number of question swap lifelines available (gained from welcome bonus or purchases)';