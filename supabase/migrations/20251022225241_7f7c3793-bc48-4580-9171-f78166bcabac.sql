-- Give Genius members 1000 coins and 25 lives bonus
DO $$
DECLARE
  genius_user RECORD;
BEGIN
  FOR genius_user IN 
    SELECT id FROM profiles WHERE is_subscriber = true
  LOOP
    -- Use credit_wallet to add bonus
    PERFORM credit_wallet(
      genius_user.id,
      1000,  -- coins
      25,    -- lives
      'admin',
      'genius_bonus_2025_10_22_' || genius_user.id::text,
      '{"reason": "Genius member bonus", "admin": true}'::jsonb
    );
  END LOOP;
END $$;