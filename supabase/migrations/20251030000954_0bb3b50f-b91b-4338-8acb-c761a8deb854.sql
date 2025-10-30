-- Drop and recreate friendship creation function with consistent return type
DROP FUNCTION IF EXISTS public.create_friendship_from_invitation(uuid, uuid);

CREATE OR REPLACE FUNCTION public.create_friendship_from_invitation(
  p_inviter_id uuid,
  p_invitee_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_ids UUID[];
  v_friendship_id UUID;
  v_thread_id UUID;
BEGIN
  -- Ensure normalized order (user_id_a < user_id_b)
  normalized_ids := normalize_user_ids(p_inviter_id, p_invitee_id);
  
  -- Create or update friendship
  INSERT INTO friendships (user_id_a, user_id_b, status, source, requested_by, created_at, updated_at)
  VALUES (
    normalized_ids[1],
    normalized_ids[2],
    'active',
    'invitation',
    p_inviter_id,
    now(),
    now()
  )
  ON CONFLICT (user_id_a, user_id_b) 
  DO UPDATE SET 
    status = 'active',
    source = 'invitation',
    updated_at = now()
  WHERE friendships.status != 'active'
  RETURNING id INTO v_friendship_id;
  
  -- Create DM thread
  INSERT INTO dm_threads (user_id_a, user_id_b)
  VALUES (normalized_ids[1], normalized_ids[2])
  ON CONFLICT (user_id_a, user_id_b) 
  DO NOTHING
  RETURNING id INTO v_thread_id;
  
  -- Get thread_id if it already existed
  IF v_thread_id IS NULL THEN
    SELECT id INTO v_thread_id FROM dm_threads
    WHERE user_id_a = normalized_ids[1] AND user_id_b = normalized_ids[2];
  END IF;
  
  -- Initialize message reads for both users
  INSERT INTO message_reads (thread_id, user_id, last_read_at)
  VALUES 
    (v_thread_id, p_inviter_id, now()),
    (v_thread_id, p_invitee_id, now())
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'friendship_id', v_friendship_id,
    'thread_id', v_thread_id,
    'message', 'Friendship created successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;