-- 1) Trigger: create profile on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Trigger: ensure invitation_code is always set on profile insert
DROP TRIGGER IF EXISTS set_invitation_code_before_insert ON public.profiles;
CREATE TRIGGER set_invitation_code_before_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invitation_code();

-- 3) Fix welcome bonus to match UI (+2500 coins, +50 lives)
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_claimed BOOLEAN;
BEGIN
  SELECT welcome_bonus_claimed INTO already_claimed
  FROM profiles WHERE id = auth.uid();
  
  IF already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Már igényelted az üdvözlő bónuszt');
  END IF;
  
  UPDATE profiles
  SET welcome_bonus_claimed = true,
      coins = coins + 2500,
      lives = lives + 50
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'coins', 2500, 'lives', 50);
END;
$$;

-- 4) Secure function to reactivate helps by spending coins
CREATE OR REPLACE FUNCTION public.reactivate_help(p_help_type TEXT, p_cost INTEGER DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_coins INTEGER;
  flag BOOLEAN;
BEGIN
  SELECT coins INTO current_coins FROM profiles WHERE id = auth.uid();
  IF current_coins < p_cost THEN
    RETURN json_build_object('success', false, 'error', 'Nincs elég aranyérméd');
  END IF;

  IF p_help_type = '50_50' THEN
    SELECT help_50_50_active INTO flag FROM profiles WHERE id = auth.uid();
    IF flag THEN RETURN json_build_object('success', false, 'error', 'Már aktív'); END IF;
    UPDATE profiles SET help_50_50_active = true, coins = coins - p_cost WHERE id = auth.uid();
  ELSIF p_help_type = '2x_answer' THEN
    SELECT help_2x_answer_active INTO flag FROM profiles WHERE id = auth.uid();
    IF flag THEN RETURN json_build_object('success', false, 'error', 'Már aktív'); END IF;
    UPDATE profiles SET help_2x_answer_active = true, coins = coins - p_cost WHERE id = auth.uid();
  ELSIF p_help_type = 'audience' THEN
    SELECT help_audience_active INTO flag FROM profiles WHERE id = auth.uid();
    IF flag THEN RETURN json_build_object('success', false, 'error', 'Már aktív'); END IF;
    UPDATE profiles SET help_audience_active = true, coins = coins - p_cost WHERE id = auth.uid();
  ELSE
    RETURN json_build_object('success', false, 'error', 'Érvénytelen segítség típus');
  END IF;

  RETURN json_build_object('success', true);
END;
$$;