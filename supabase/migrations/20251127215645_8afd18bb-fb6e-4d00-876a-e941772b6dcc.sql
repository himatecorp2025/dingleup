-- Guaranteed 1-minute lootbox drop for first 3 daily logins
-- Modifies generate_lootbox_daily_plan to create guaranteed lootbox slot 
-- 1 minute after login for the first 3 sessions of each day

CREATE OR REPLACE FUNCTION public.generate_lootbox_daily_plan(
  p_user_id UUID,
  p_plan_date DATE,
  p_first_login_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_plan_id UUID;
  v_target_count INTEGER;
  v_activity_window JSONB;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_slots JSONB := '[]'::jsonb;
  v_slot_time TIMESTAMPTZ;
  v_window_duration_seconds INTEGER;
  v_random_offset INTEGER;
  v_today_session_count INTEGER;
  v_guaranteed_slot_time TIMESTAMPTZ;
  i INTEGER;
BEGIN
  -- Count today's session_start events for this user
  SELECT COUNT(*)
  INTO v_today_session_count
  FROM public.app_session_events
  WHERE user_id = p_user_id
    AND event_type = 'session_start'
    AND DATE(created_at) = p_plan_date;

  -- Random target count between 10 and 20 (inclusive)
  v_target_count := 10 + floor(random() * 11)::INTEGER;
  
  -- Get user's typical activity window
  v_activity_window := public.get_user_activity_window(p_user_id, 7);
  
  IF v_activity_window IS NOT NULL THEN
    -- Use historical activity pattern
    v_window_start := (p_plan_date::TEXT || ' ' || (v_activity_window->>'start_hour') || ':00:00')::TIMESTAMPTZ;
    v_window_end := (p_plan_date::TEXT || ' ' || (v_activity_window->>'end_hour') || ':59:59')::TIMESTAMPTZ;
  ELSE
    -- Fallback: use first login time + 4 hours window
    v_window_start := p_first_login_time;
    v_window_end := LEAST(
      p_first_login_time + INTERVAL '4 hours',
      (p_plan_date::TEXT || ' 23:59:59')::TIMESTAMPTZ
    );
  END IF;
  
  -- Calculate window duration in seconds
  v_window_duration_seconds := EXTRACT(EPOCH FROM (v_window_end - v_window_start))::INTEGER;
  
  -- GUARANTEED SLOT for first 3 logins: exactly 1 minute after p_first_login_time
  IF v_today_session_count <= 3 THEN
    v_guaranteed_slot_time := p_first_login_time + INTERVAL '1 minute';
    
    -- Add guaranteed first slot
    v_slots := v_slots || jsonb_build_object(
      'slot_id', 1,
      'slot_time', v_guaranteed_slot_time,
      'status', 'pending',
      'guaranteed', true
    );
    
    -- Generate remaining random slots (starting from slot_id 2)
    FOR i IN 2..v_target_count LOOP
      v_random_offset := floor(random() * v_window_duration_seconds)::INTEGER;
      v_slot_time := v_window_start + (v_random_offset || ' seconds')::INTERVAL;
      
      v_slots := v_slots || jsonb_build_object(
        'slot_id', i,
        'slot_time', v_slot_time,
        'status', 'pending'
      );
    END LOOP;
  ELSE
    -- After 3rd login: all slots are random (no guaranteed slot)
    FOR i IN 1..v_target_count LOOP
      v_random_offset := floor(random() * v_window_duration_seconds)::INTEGER;
      v_slot_time := v_window_start + (v_random_offset || ' seconds')::INTERVAL;
      
      v_slots := v_slots || jsonb_build_object(
        'slot_id', i,
        'slot_time', v_slot_time,
        'status', 'pending'
      );
    END LOOP;
  END IF;
  
  -- Sort slots by time (ascending)
  v_slots := (
    SELECT jsonb_agg(slot ORDER BY (slot->>'slot_time')::TIMESTAMPTZ)
    FROM jsonb_array_elements(v_slots) AS slot
  );
  
  -- Insert daily plan
  INSERT INTO public.lootbox_daily_plan (
    user_id,
    plan_date,
    target_count,
    delivered_count,
    slots,
    active_window_start,
    active_window_end
  )
  VALUES (
    p_user_id,
    p_plan_date,
    v_target_count,
    0,
    v_slots,
    v_window_start,
    v_window_end
  )
  ON CONFLICT (user_id, plan_date) DO NOTHING
  RETURNING id INTO v_plan_id;
  
  RETURN v_plan_id;
END;
$$;