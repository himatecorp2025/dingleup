ALTER TABLE public.lootbox_instances DROP CONSTRAINT IF EXISTS lootbox_instances_source_check;

ALTER TABLE public.lootbox_instances
ADD CONSTRAINT lootbox_instances_source_check
CHECK (
  source = ANY (
    ARRAY[
      'random_drop'::text,
      'purchase'::text,
      'test'::text,
      'daily_first_login'::text,
      'activity_random'::text
    ]
  )
);