-- Remove all Genius/subscription-related columns from database

-- Remove is_subscribed column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS is_subscribed;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_expires_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_id;

-- Remove became_genius_day from user_cohorts
ALTER TABLE user_cohorts DROP COLUMN IF EXISTS became_genius_day;

-- Drop subscriptions table if it exists
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Drop monetization_analytics table (unused after shop/genius removal)
DROP TABLE IF EXISTS monetization_analytics CASCADE;