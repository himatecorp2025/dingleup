-- Fix search_path for invitation reward functions
DROP FUNCTION IF EXISTS get_invitation_tier_reward(INT);
DROP FUNCTION IF EXISTS process_invitation_reward(UUID);

-- Function to calculate invitation rewards based on tier
CREATE OR REPLACE FUNCTION get_invitation_tier_reward(accepted_count INT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE
    WHEN accepted_count = 1 OR accepted_count = 2 THEN
      RETURN json_build_object('coins', 200, 'lives', 3);
    WHEN accepted_count >= 3 AND accepted_count <= 9 THEN
      RETURN json_build_object('coins', 1000, 'lives', 5);
    WHEN accepted_count >= 10 THEN
      RETURN json_build_object('coins', 6000, 'lives', 20);
    ELSE
      RETURN json_build_object('coins', 0, 'lives', 0);
  END CASE;
END;
$$;

-- Function to process invitation rewards when someone accepts
CREATE OR REPLACE FUNCTION process_invitation_reward(inviter_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepted_count INT;
  reward JSON;
  coins_reward INT;
  lives_reward INT;
BEGIN
  SELECT COUNT(*) INTO accepted_count
  FROM invitations
  WHERE inviter_id = inviter_user_id AND accepted = true;
  
  reward := get_invitation_tier_reward(accepted_count);
  coins_reward := (reward->>'coins')::INT;
  lives_reward := (reward->>'lives')::INT;
  
  UPDATE profiles
  SET 
    coins = coins + coins_reward,
    lives = LEAST(lives + lives_reward, max_lives + lives_reward)
  WHERE id = inviter_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'coins', coins_reward, 
    'lives', lives_reward,
    'total_accepted', accepted_count
  );
END;
$$;