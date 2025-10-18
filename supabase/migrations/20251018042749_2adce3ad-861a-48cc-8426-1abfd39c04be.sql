-- Allow lives to go up to 200x max_lives for boosters and bonuses
-- but regeneration will still only restore to max_lives (15)
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_lives_check,
  ADD CONSTRAINT profiles_lives_check CHECK (lives >= 0 AND lives <= max_lives * 200);

-- The regenerate_lives function already stops at max_lives, which is correct
-- It uses LEAST(lives + lives_to_add, max_lives) so it won't exceed the base max_lives