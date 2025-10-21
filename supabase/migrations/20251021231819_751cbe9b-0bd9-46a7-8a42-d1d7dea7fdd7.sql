-- Security Fix 1: Update process_invitation_reward to use auth.uid() instead of parameter
-- This prevents potential abuse if function is accidentally exposed to RPC
DROP FUNCTION IF EXISTS public.process_invitation_reward(uuid);

CREATE OR REPLACE FUNCTION public.process_invitation_reward()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  accepted_count INT;
  reward JSON;
  coins_reward INT;
  lives_reward INT;
BEGIN
  -- Use auth.uid() instead of parameter for security
  SELECT COUNT(*) INTO accepted_count
  FROM invitations
  WHERE inviter_id = auth.uid() AND accepted = true;
  
  reward := get_invitation_tier_reward(accepted_count);
  coins_reward := (reward->>'coins')::INT;
  lives_reward := (reward->>'lives')::INT;
  
  UPDATE profiles
  SET 
    coins = coins + coins_reward,
    lives = LEAST(lives + lives_reward, max_lives + lives_reward)
  WHERE id = auth.uid();
  
  RETURN json_build_object(
    'success', true, 
    'coins', coins_reward, 
    'lives', lives_reward,
    'total_accepted', accepted_count
  );
END;
$function$;

-- Security Fix 2: Split weekly_rankings policy into granular policies
DROP POLICY IF EXISTS "Service role can manage weekly rankings" ON weekly_rankings;

-- Read access
CREATE POLICY "Service can read rankings"
  ON weekly_rankings FOR SELECT
  TO service_role
  USING (true);

-- Insert new rankings
CREATE POLICY "Service can insert rankings"
  ON weekly_rankings FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Update existing rankings
CREATE POLICY "Service can update rankings"
  ON weekly_rankings FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Delete old rankings (with time constraint for safety)
CREATE POLICY "Service can delete old rankings"
  ON weekly_rankings FOR DELETE
  TO service_role
  USING (created_at < now() - interval '90 days');

-- Security Fix 3: Add comments to internal-only SECURITY DEFINER functions
COMMENT ON FUNCTION public.process_invitation_reward() IS 'INTERNAL USE ONLY - Called from accept-invitation edge function. Do not expose to client RPC.';
COMMENT ON FUNCTION public.activate_speed_booster(uuid) IS 'INTERNAL USE ONLY - Called from game logic with validated booster_id. Uses SECURITY DEFINER to update profiles.';
COMMENT ON FUNCTION public.award_coins(integer) IS 'CLIENT RPC SAFE - Validates amount and user via auth.uid().';
COMMENT ON FUNCTION public.spend_coins(integer) IS 'CLIENT RPC SAFE - Validates amount and user via auth.uid().';
COMMENT ON FUNCTION public.regenerate_lives() IS 'CLIENT RPC SAFE - Only affects calling user via auth.uid().';
COMMENT ON FUNCTION public.use_life() IS 'CLIENT RPC SAFE - Only affects calling user via auth.uid().';