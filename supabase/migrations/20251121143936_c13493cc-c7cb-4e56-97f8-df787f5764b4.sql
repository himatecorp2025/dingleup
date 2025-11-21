-- FIX: Function search_path for new security functions
-- These functions had no search_path set, now fixing

DROP FUNCTION IF EXISTS public.cleanup_expired_sessions();
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false,
      revoked_at = NOW(),
      revoked_reason = 'expired'
  WHERE is_active = true
    AND expires_at < NOW();
END;
$$;

DROP FUNCTION IF EXISTS public.log_admin_action(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    old_value,
    new_value,
    status,
    error_message
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_value,
    p_new_value,
    p_status,
    p_error_message
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;