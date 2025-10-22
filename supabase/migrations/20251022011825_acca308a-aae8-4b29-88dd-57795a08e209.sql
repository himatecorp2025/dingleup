-- Add soft delete columns to dm_threads for archiving conversations
ALTER TABLE public.dm_threads
ADD COLUMN IF NOT EXISTS archived_by_user_a boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_by_user_b boolean DEFAULT false;

-- Add index for better query performance on archived threads
CREATE INDEX IF NOT EXISTS idx_dm_threads_archived_a ON public.dm_threads(user_id_a, archived_by_user_a);
CREATE INDEX IF NOT EXISTS idx_dm_threads_archived_b ON public.dm_threads(user_id_b, archived_by_user_b);

-- Create function to archive thread for a specific user
CREATE OR REPLACE FUNCTION public.archive_thread_for_user(p_thread_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_thread RECORD;
  v_user_id uuid := auth.uid();
BEGIN
  -- Get the thread
  SELECT * INTO v_thread
  FROM public.dm_threads
  WHERE id = p_thread_id
    AND (user_id_a = v_user_id OR user_id_b = v_user_id);

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Thread not found');
  END IF;

  -- Archive for the appropriate user
  IF v_thread.user_id_a = v_user_id THEN
    UPDATE public.dm_threads
    SET archived_by_user_a = true
    WHERE id = p_thread_id;
  ELSIF v_thread.user_id_b = v_user_id THEN
    UPDATE public.dm_threads
    SET archived_by_user_b = true
    WHERE id = p_thread_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

COMMENT ON FUNCTION public.archive_thread_for_user IS 'Soft-delete (archive) a thread for the current user';