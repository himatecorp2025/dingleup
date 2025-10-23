-- Create RPC function for efficient user search with trigram similarity
CREATE OR REPLACE FUNCTION public.search_users_by_name(
  search_query text,
  current_user_id uuid,
  result_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url
  FROM profiles p
  WHERE p.id != current_user_id
    AND (
      lower(p.username) LIKE search_query || '%'
      OR similarity(lower(p.username), search_query) > 0.3
    )
  ORDER BY
    (lower(p.username) LIKE search_query || '%') DESC,
    similarity(lower(p.username), search_query) DESC
  LIMIT result_limit;
END;
$$;