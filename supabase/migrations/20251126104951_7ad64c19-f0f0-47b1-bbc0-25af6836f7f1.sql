-- Add country_code to daily_winner_awarded table for country-specific rewards
ALTER TABLE daily_winner_awarded 
ADD COLUMN IF NOT EXISTS country_code text;

-- Add index for faster country-specific queries
CREATE INDEX IF NOT EXISTS idx_daily_winner_awarded_country_user 
ON daily_winner_awarded(country_code, user_id, day_date);

-- Add tracking table for last processed time per country
CREATE TABLE IF NOT EXISTS daily_winner_processing_log (
  country_code text PRIMARY KEY,
  last_processed_date date NOT NULL,
  last_processed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on processing log (only service role)
ALTER TABLE daily_winner_processing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage processing log"
ON daily_winner_processing_log
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');