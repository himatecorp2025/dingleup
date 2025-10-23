
-- Töröljük a duplikált friendships-eket ahol user_id_a > user_id_b
-- (A helyes sorrend: user_id_a < user_id_b)
DELETE FROM public.friendships
WHERE id IN (
  SELECT f1.id
  FROM public.friendships f1
  WHERE EXISTS (
    SELECT 1 FROM public.friendships f2
    WHERE f2.user_id_a = f1.user_id_b 
      AND f2.user_id_b = f1.user_id_a
      AND f1.user_id_a > f1.user_id_b
      AND f1.status = 'active'
      AND f2.status = 'active'
  )
);
