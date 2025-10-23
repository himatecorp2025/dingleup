-- Performance Optimizations for 10K+ concurrent users

-- 1. Critical Indexes
CREATE INDEX IF NOT EXISTS idx_dm_threads_users ON dm_threads(user_id_a, user_id_b);
CREATE INDEX IF NOT EXISTS idx_dm_threads_last_message ON dm_threads(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_created ON dm_messages(thread_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(user_id) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_message_reads_lookup ON message_reads(thread_id, user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_active ON friendships(user_id_a, user_id_b) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_active ON game_sessions(user_id, session_id) WHERE completed_at IS NULL;

-- 2. Optimized thread fetching function
CREATE OR REPLACE FUNCTION get_user_threads_optimized(p_user_id uuid)
RETURNS TABLE (
  thread_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message_at timestamptz,
  is_online boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as thread_id,
    CASE 
      WHEN t.user_id_a = p_user_id THEN t.user_id_b 
      ELSE t.user_id_a 
    END as other_user_id,
    p.username as other_user_name,
    p.avatar_url as other_user_avatar,
    t.last_message_at,
    COALESCE(up.is_online, false) as is_online
  FROM dm_threads t
  LEFT JOIN public_profiles p ON (
    CASE 
      WHEN t.user_id_a = p_user_id THEN t.user_id_b 
      ELSE t.user_id_a 
    END = p.id
  )
  LEFT JOIN user_presence up ON up.user_id = p.id
  WHERE (t.user_id_a = p_user_id OR t.user_id_b = p_user_id)
    AND (
      (t.user_id_a = p_user_id AND COALESCE(t.archived_by_user_a, false) = false)
      OR
      (t.user_id_b = p_user_id AND COALESCE(t.archived_by_user_b, false) = false)
    )
  ORDER BY t.last_message_at DESC NULLS LAST;
END;
$$;