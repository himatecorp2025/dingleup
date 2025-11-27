-- Helper function to create lootbox drops with elevated privileges (bypass RLS safely)
CREATE OR REPLACE FUNCTION public.create_lootbox_drop(
  p_user_id uuid,
  p_source text,
  p_open_cost_gold integer,
  p_expires_at timestamptz,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS lootbox_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_drop lootbox_instances;
BEGIN
  INSERT INTO public.lootbox_instances (
    user_id,
    status,
    source,
    open_cost_gold,
    expires_at,
    metadata
  )
  VALUES (
    p_user_id,
    'active_drop',
    p_source,
    p_open_cost_gold,
    p_expires_at,
    p_metadata
  )
  RETURNING * INTO v_new_drop;

  RETURN v_new_drop;
END;
$function$;