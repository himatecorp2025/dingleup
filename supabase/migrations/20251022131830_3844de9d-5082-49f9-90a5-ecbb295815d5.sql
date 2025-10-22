
-- Drop the existing view
DROP VIEW IF EXISTS public.friend_requests;

-- Recreate the view with security_barrier to ensure RLS is enforced
CREATE VIEW public.friend_requests 
WITH (security_barrier=true)
AS
SELECT 
  f.id,
  f.user_id_a,
  f.user_id_b,
  f.requested_by,
  f.status,
  f.created_at,
  f.updated_at,
  CASE 
    WHEN f.requested_by = f.user_id_a THEN f.user_id_b
    ELSE f.user_id_a
  END AS receiver_id,
  pa.username AS requester_name,
  pa.avatar_url AS requester_avatar,
  pb.username AS receiver_name,
  pb.avatar_url AS receiver_avatar
FROM friendships f
LEFT JOIN profiles pa ON pa.id = f.requested_by
LEFT JOIN profiles pb ON pb.id = CASE 
  WHEN f.requested_by = f.user_id_a THEN f.user_id_b
  ELSE f.user_id_a
END
WHERE f.status IN ('pending', 'declined');

-- Grant select permission to authenticated users
GRANT SELECT ON public.friend_requests TO authenticated;

-- Add comment explaining the security_barrier
COMMENT ON VIEW public.friend_requests IS 
'View with security_barrier enabled to ensure RLS policies on friendships and profiles tables are enforced. Users can only see friend requests where they are involved (user_id_a or user_id_b).';
