-- friend_requests view javítása SECURITY INVOKER-re
DROP VIEW IF EXISTS public.friend_requests CASCADE;

CREATE VIEW public.friend_requests
WITH (security_invoker = true)
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
  END as receiver_id,
  pa.username as requester_name,
  pa.avatar_url as requester_avatar,
  pb.username as receiver_name,
  pb.avatar_url as receiver_avatar
FROM friendships f
LEFT JOIN public_profiles pa ON pa.id = f.requested_by
LEFT JOIN public_profiles pb ON pb.id = CASE 
  WHEN f.requested_by = f.user_id_a THEN f.user_id_b
  ELSE f.user_id_a
END
WHERE f.status IN ('pending', 'declined');

-- Grant permission
GRANT SELECT ON public.friend_requests TO authenticated;