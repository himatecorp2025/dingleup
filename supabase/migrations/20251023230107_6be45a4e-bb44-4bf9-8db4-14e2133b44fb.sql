-- Add 'admin' to allowed friendship sources
ALTER TABLE public.friendships DROP CONSTRAINT IF EXISTS friendships_source_check;

ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_source_check 
CHECK (source IN ('invite', 'referral', 'admin'));