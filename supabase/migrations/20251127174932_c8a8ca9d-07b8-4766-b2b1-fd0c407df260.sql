
-- Add 'daily_activity' to lootbox_instances source check constraint
ALTER TABLE public.lootbox_instances 
DROP CONSTRAINT IF EXISTS lootbox_instances_source_check;

ALTER TABLE public.lootbox_instances 
ADD CONSTRAINT lootbox_instances_source_check 
CHECK (source IN (
  'random_drop',
  'purchase',
  'test',
  'daily_first_login',
  'activity_random',
  'daily_activity'  -- NEW: activity-based daily drop system
));
