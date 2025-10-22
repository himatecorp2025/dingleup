-- Reset all users coins and lives to zero
UPDATE profiles 
SET 
  coins = 0,
  lives = 0,
  updated_at = now()
WHERE id IS NOT NULL;