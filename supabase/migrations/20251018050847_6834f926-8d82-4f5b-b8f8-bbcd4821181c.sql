-- Create a secure RPC to activate a speed booster and update the user's profile
create or replace function public.activate_speed_booster(booster_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
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

  -- Map booster types
  case v_booster.booster_type
    when 'DoubleSpeed' then v_multiplier := 2; v_max_lives := 20;
    when 'MegaSpeed'   then v_multiplier := 4; v_max_lives := 25;
    when 'GigaSpeed'   then v_multiplier := 12; v_max_lives := 30;
    when 'DingleSpeed' then v_multiplier := 24; v_max_lives := 35;
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
$$;