-- Add user_timezone column to profiles for automatic device timezone detection
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_timezone text DEFAULT 'Europe/Budapest';

-- Add index for faster timezone-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_timezone 
ON profiles(user_timezone);

-- Add timezone to daily_winner_awarded for accurate tracking
ALTER TABLE daily_winner_awarded
ADD COLUMN IF NOT EXISTS user_timezone text;

-- Update daily_winner_processing_log to track by timezone instead of country
DROP TABLE IF EXISTS daily_winner_processing_log;

CREATE TABLE daily_winner_processing_log (
  timezone text PRIMARY KEY,
  last_processed_date date NOT NULL,
  last_processed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE daily_winner_processing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage processing log"
ON daily_winner_processing_log
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');