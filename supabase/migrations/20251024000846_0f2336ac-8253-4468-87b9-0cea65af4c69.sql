-- Rename help_50_50_active to help_third_active
ALTER TABLE public.profiles 
RENAME COLUMN help_50_50_active TO help_third_active;

-- Update use_help function to use 'third' instead of '50_50'
CREATE OR REPLACE FUNCTION public.use_help(p_help_type text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  help_available BOOLEAN;
  result json;
BEGIN
  IF p_help_type = 'third' THEN
    SELECT help_third_active INTO help_available FROM profiles WHERE id = auth.uid();
    
    IF NOT help_available THEN
      RETURN json_build_object('success', false, 'error', 'Ez a segítség már nem elérhető');
    END IF;
    
    UPDATE profiles SET help_third_active = false WHERE id = auth.uid();
    RETURN json_build_object('success', true);
    
  ELSIF p_help_type = '2x_answer' THEN
    SELECT help_2x_answer_active INTO help_available FROM profiles WHERE id = auth.uid();
    
    IF NOT help_available THEN
      RETURN json_build_object('success', false, 'error', 'Ez a segítség már nem elérhető');
    END IF;
    
    UPDATE profiles SET help_2x_answer_active = false WHERE id = auth.uid();
    RETURN json_build_object('success', true);
    
  ELSIF p_help_type = 'audience' THEN
    SELECT help_audience_active INTO help_available FROM profiles WHERE id = auth.uid();
    
    IF NOT help_available THEN
      RETURN json_build_object('success', false, 'error', 'Ez a segítség már nem elérhető');
    END IF;
    
    UPDATE profiles SET help_audience_active = false WHERE id = auth.uid();
    RETURN json_build_object('success', true);
    
  ELSE
    RETURN json_build_object('success', false, 'error', 'Érvénytelen segítség típus');
  END IF;
END;
$function$;

-- Update reactivate_help function to use 'third' instead of '50_50'
CREATE OR REPLACE FUNCTION public.reactivate_help(p_help_type text, p_cost integer DEFAULT 30)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_coins INTEGER;
  flag BOOLEAN;
BEGIN
  SELECT coins INTO current_coins FROM profiles WHERE id = auth.uid();
  IF current_coins < p_cost THEN
    RETURN json_build_object('success', false, 'error', 'Nincs elég aranyérméd');
  END IF;

  IF p_help_type = 'third' THEN
    SELECT help_third_active INTO flag FROM profiles WHERE id = auth.uid();
    IF flag THEN RETURN json_build_object('success', false, 'error', 'Már aktív'); END IF;
    UPDATE profiles SET help_third_active = true, coins = coins - p_cost WHERE id = auth.uid();
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
$function$;

-- Update reset_game_helps function
CREATE OR REPLACE FUNCTION public.reset_game_helps()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles
  SET 
    help_third_active = true,
    help_2x_answer_active = true,
    help_audience_active = true
  WHERE id = auth.uid();
END;
$function$;