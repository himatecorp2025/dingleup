-- Create lootbox_daily_plan table for per-user, per-day lootbox scheduling
CREATE TABLE IF NOT EXISTS public.lootbox_daily_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  target_count INTEGER NOT NULL CHECK (target_count >= 10 AND target_count <= 20),
  delivered_count INTEGER NOT NULL DEFAULT 0,
  slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_window_start TIMESTAMPTZ,
  active_window_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

-- Index for fast lookups
CREATE INDEX idx_lootbox_daily_plan_user_date ON public.lootbox_daily_plan(user_id, plan_date);
CREATE INDEX idx_lootbox_daily_plan_date ON public.lootbox_daily_plan(plan_date);

-- RLS policies
ALTER TABLE public.lootbox_daily_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily plans"
  ON public.lootbox_daily_plan
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all daily plans"
  ON public.lootbox_daily_plan
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to calculate user's typical active hours based on recent activity
CREATE OR REPLACE FUNCTION public.get_user_activity_window(p_user_id UUID, p_lookback_days INTEGER DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_hour_counts JSONB;
  v_peak_start_hour INTEGER;
  v_peak_end_hour INTEGER;
  v_window_start TIME;
  v_window_end TIME;
  v_total_events INTEGER;
BEGIN
  -- Count events by hour of day (UTC) over last N days
  WITH hourly_activity AS (
    SELECT 
      EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')::INTEGER AS hour,
      COUNT(*) AS event_count
    FROM (
      -- Combine multiple activity sources
      SELECT created_at FROM app_session_events WHERE user_id = p_user_id AND created_at >= NOW() - (p_lookback_days || ' days')::INTERVAL
      UNION ALL
      SELECT created_at FROM game_results WHERE user_id = p_user_id AND created_at >= NOW() - (p_lookback_days || ' days')::INTERVAL
      UNION ALL
      SELECT created_at FROM navigation_events WHERE user_id = p_user_id AND created_at >= NOW() - (p_lookback_days || ' days')::INTERVAL
    ) combined_events
    GROUP BY hour
  ),
  peak_hours AS (
    SELECT hour, event_count
    FROM hourly_activity
    ORDER BY event_count DESC
    LIMIT 6  -- Top 6 most active hours
  )
  SELECT 
    MIN(hour), 
    MAX(hour),
    SUM(event_count)
  INTO v_peak_start_hour, v_peak_end_hour, v_total_events
  FROM peak_hours;
  
  -- If no activity history, return NULL (will use first login time as fallback)
  IF v_total_events IS NULL OR v_total_events = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Expand window by 1 hour on each side for buffer
  v_peak_start_hour := GREATEST(0, v_peak_start_hour - 1);
  v_peak_end_hour := LEAST(23, v_peak_end_hour + 1);
  
  RETURN jsonb_build_object(
    'start_hour', v_peak_start_hour,
    'end_hour', v_peak_end_hour,
    'total_events', v_total_events
  );
END;
$$;

-- Function to generate daily lootbox plan with activity-based slots
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
  i INTEGER;
BEGIN
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
  
  -- Generate random slot times within active window
  FOR i IN 1..v_target_count LOOP
    v_random_offset := floor(random() * v_window_duration_seconds)::INTEGER;
    v_slot_time := v_window_start + (v_random_offset || ' seconds')::INTERVAL;
    
    v_slots := v_slots || jsonb_build_object(
      'slot_id', i,
      'slot_time', v_slot_time,
      'status', 'pending'
    );
  END LOOP;
  
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