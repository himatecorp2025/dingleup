-- Frissítjük a meghívási jutalom függvényt az új jutalmazási rendszerhez
CREATE OR REPLACE FUNCTION public.get_invitation_tier_reward(accepted_count integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Hozzáadunk egy oszlopot a profilokhoz a 60 napos reset követéséhez
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS invitation_rewards_reset_at timestamp with time zone DEFAULT (now() + interval '60 days');

-- Adatbázis függvény háttérben történő élet regeneráláshoz (minden booster típussal)
CREATE OR REPLACE FUNCTION public.regenerate_lives_background()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  profile_rec RECORD;
  minutes_passed NUMERIC;
  lives_to_add INTEGER;
  regen_rate_minutes NUMERIC;
  effective_max_lives INTEGER;
BEGIN
  FOR profile_rec IN 
    SELECT * FROM profiles 
    WHERE lives < max_lives OR (speed_booster_active AND speed_booster_expires_at > now())
  LOOP
    -- Ellenőrizzük, hogy aktív-e a booster és még nem járt le
    IF profile_rec.speed_booster_active AND profile_rec.speed_booster_expires_at > now() THEN
      -- Booster aktív, gyorsított regenerálás
      CASE profile_rec.speed_booster_multiplier
        WHEN 2 THEN 
          regen_rate_minutes := 6;
          effective_max_lives := 25;
        WHEN 4 THEN 
          regen_rate_minutes := 3;
          effective_max_lives := 35;
        WHEN 12 THEN 
          regen_rate_minutes := 1;
          effective_max_lives := 75;
        WHEN 24 THEN 
          regen_rate_minutes := 0.5;
          effective_max_lives := 135;
        ELSE 
          regen_rate_minutes := 12;
          effective_max_lives := 15;
      END CASE;
    ELSE
      -- Nincs aktív booster vagy lejárt
      regen_rate_minutes := 12;
      effective_max_lives := 15;
      
      -- Ha lejárt a booster, állítsuk vissza
      IF profile_rec.speed_booster_active AND profile_rec.speed_booster_expires_at <= now() THEN
        UPDATE profiles
        SET speed_booster_active = false,
            speed_booster_expires_at = null,
            speed_booster_multiplier = 1,
            max_lives = 15
        WHERE id = profile_rec.id;
      END IF;
    END IF;
    
    -- Csak akkor számolunk, ha az életek a határ alatt vannak
    IF profile_rec.lives < effective_max_lives THEN
      minutes_passed := EXTRACT(EPOCH FROM (NOW() - profile_rec.last_life_regeneration)) / 60;
      lives_to_add := FLOOR(minutes_passed / regen_rate_minutes)::INTEGER;
      
      IF lives_to_add > 0 THEN
        UPDATE profiles
        SET 
          lives = LEAST(lives + lives_to_add, effective_max_lives),
          last_life_regeneration = last_life_regeneration + (lives_to_add * regen_rate_minutes * INTERVAL '1 minute')
        WHERE id = profile_rec.id;
      END IF;
    END IF;
  END LOOP;
END;
$function$;

-- Frissítjük az activate_speed_booster függvényt az új max_lives értékekkel
CREATE OR REPLACE FUNCTION public.activate_speed_booster(booster_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_booster record;
  v_multiplier int;
  v_max_lives int;
  v_expires_at timestamptz := now() + interval '60 minutes';
begin
  -- Ensure the booster exists, belongs to the caller and is not yet activated
  select * into v_booster
  from public.user_boosters
  where id = booster_id and user_id = auth.uid();

  if not found then
    raise exception 'Booster not found or not owned by user';
  end if;

  if v_booster.activated then
    return true; -- already active
  end if;

  -- Map booster types with updated max_lives
  case v_booster.booster_type
    when 'DoubleSpeed' then v_multiplier := 2; v_max_lives := 25;
    when 'MegaSpeed'   then v_multiplier := 4; v_max_lives := 35;
    when 'GigaSpeed'   then v_multiplier := 12; v_max_lives := 75;
    when 'DingleSpeed' then v_multiplier := 24; v_max_lives := 135;
    else raise exception 'Unknown booster type: %', v_booster.booster_type;
  end case;

  -- Activate booster
  update public.user_boosters
     set activated = true,
         activated_at = now(),
         expires_at = v_expires_at
   where id = booster_id and user_id = auth.uid();

  -- Update profile atomically
  update public.profiles
     set speed_booster_active = true,
         speed_booster_expires_at = v_expires_at,
         speed_booster_multiplier = v_multiplier,
         max_lives = v_max_lives,
         updated_at = now()
   where id = auth.uid();

  return true;
end;
$function$;