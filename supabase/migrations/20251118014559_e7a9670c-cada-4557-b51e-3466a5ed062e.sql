-- Create or replace atomic life spending function that also normalizes regeneration timestamp and computes regenerated lives in-transaction
create or replace function public.use_life()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  now_ts timestamptz := now();
  v_lives int;
  v_max int;
  v_rate int; -- minutes per life
  v_last timestamptz;
  elapsed_seconds int;
  gained int;
  remainder_seconds int;
begin
  -- Require authenticated user
  if uid is null then
    return false;
  end if;

  -- Lock the user's profile row for update to avoid race conditions
  select coalesce(lives, 0), coalesce(max_lives, 5), coalesce(lives_regeneration_rate, 12), coalesce(last_life_regeneration, now_ts)
    into v_lives, v_max, v_rate, v_last
  from profiles
  where id = uid
  for update;

  if not found then
    return false;
  end if;

  -- Normalize any future timestamps to now (strict validation)
  if v_last > now_ts then
    v_last := now_ts;
  end if;

  -- Apply passive regeneration before spending a life
  if v_lives < v_max then
    elapsed_seconds := GREATEST(0, floor(extract(epoch from (now_ts - v_last)))::int);
    if v_rate is null or v_rate <= 0 then
      v_rate := 12; -- safety default
    end if;
    gained := elapsed_seconds / (v_rate * 60);

    if gained > 0 then
      v_lives := LEAST(v_max, v_lives + gained);
      if v_lives < v_max then
        -- Keep leftover remainder to preserve correct next regen time
        remainder_seconds := elapsed_seconds % (v_rate * 60);
        v_last := now_ts - make_interval(secs => remainder_seconds);
      else
        -- Full, reset anchor to now
        v_last := now_ts;
      end if;
    end if;
  end if;

  -- After regeneration, ensure at least 1 life is available
  if v_lives < 1 then
    -- Persist normalized timestamp if it changed
    update profiles set last_life_regeneration = v_last, updated_at = now_ts where id = uid;
    return false;
  end if;

  -- Spend one life
  update profiles
  set lives = v_lives - 1,
      last_life_regeneration = v_last,
      updated_at = now_ts
  where id = uid;

  -- Optional: write to wallet_ledger for transparency
  insert into wallet_ledger (user_id, idempotency_key, delta_lives, delta_coins, source, metadata)
  values (uid, gen_random_uuid()::text, -1, 0, 'use_life', json_build_object('reason','game_start','at', now_ts));

  return true;
end;
$$;

-- Allow authenticated users to execute the function
grant execute on function public.use_life() to authenticated;