-- Update invitation rewards system to support tier-based rewards
-- 1-2 friends: 200 coins + 3 lives each
-- 3-9 friends: 1000 coins + 5 lives each  
-- 10+ friends: 6000 coins + 20 lives each

-- Update the accept_invitation function to handle new reward tiers
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_code_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inviter_user_id uuid;
  invitation_record record;
  accepted_count int;
  reward_coins int;
  reward_lives int;
BEGIN
  -- Get the invitation record
  SELECT * INTO invitation_record
  FROM invitations
  WHERE invitation_code = invitation_code_input
    AND invited_user_id = auth.uid()
    AND accepted = false
  LIMIT 1;

  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or already accepted invitation');
  END IF;

  inviter_user_id := invitation_record.inviter_id;

  -- Mark invitation as accepted
  UPDATE invitations
  SET accepted = true,
      accepted_at = now()
  WHERE id = invitation_record.id;

  -- Count how many friends the inviter has (including this one)
  SELECT COUNT(*) INTO accepted_count
  FROM invitations
  WHERE inviter_id = inviter_user_id
    AND accepted = true;

  -- Determine reward based on tier
  IF accepted_count >= 1 AND accepted_count <= 2 THEN
    reward_coins := 200;
    reward_lives := 3;
  ELSIF accepted_count >= 3 AND accepted_count <= 9 THEN
    reward_coins := 1000;
    reward_lives := 5;
  ELSIF accepted_count >= 10 THEN
    reward_coins := 6000;
    reward_lives := 20;
  ELSE
    reward_coins := 0;
    reward_lives := 0;
  END IF;

  -- Award coins and lives to inviter
  IF reward_coins > 0 THEN
    UPDATE profiles
    SET coins = GREATEST(0, coins + reward_coins),
        lives = LEAST(max_lives, lives + reward_lives)
    WHERE id = inviter_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'inviter_id', inviter_user_id,
    'reward_coins', reward_coins,
    'reward_lives', reward_lives,
    'total_accepted', accepted_count
  );
END;
$$;