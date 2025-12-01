-- PHASE 2 OPTIMIZATION: Aggressive cleanup for completed game sessions
-- Removes old sessions after 24 hours to prevent table bloat

CREATE OR REPLACE FUNCTION public.cleanup_completed_game_sessions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_cutoff_time TIMESTAMPTZ;
BEGIN
  -- Delete sessions completed more than 24 hours ago
  v_cutoff_time := NOW() - INTERVAL '24 hours';
  
  DELETE FROM public.game_sessions
  WHERE completed_at IS NOT NULL
    AND completed_at < v_cutoff_time;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Also delete expired sessions that were never completed (over 30 minutes old)
  DELETE FROM public.game_sessions
  WHERE completed_at IS NULL
    AND expires_at < NOW();
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_completed', v_deleted_count,
    'cutoff_time', v_cutoff_time
  );
END;
$$;