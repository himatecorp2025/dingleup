-- Rename weekly_winners_popup_views to daily_winners_popup_views
ALTER TABLE weekly_winners_popup_views RENAME TO daily_winners_popup_views;

-- Update column names for clarity (week_start → day_date, last_shown_week → last_shown_day)
ALTER TABLE daily_winners_popup_views RENAME COLUMN last_shown_week TO last_shown_day;

-- Add comment for clarity
COMMENT ON TABLE daily_winners_popup_views IS 'Tracks when users have seen the daily winners popup to prevent showing it multiple times per day';
COMMENT ON COLUMN daily_winners_popup_views.last_shown_day IS 'The date (YYYY-MM-DD format) when the user last saw the daily winners popup';

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_daily_winners_popup_user_day 
ON daily_winners_popup_views(user_id, last_shown_day);