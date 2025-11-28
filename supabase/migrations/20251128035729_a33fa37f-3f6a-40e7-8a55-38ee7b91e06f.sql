-- Add shown_sessions column to user_like_prompt_tracking table
-- This tracks which game sessions have already shown the like prompt
-- Ensures popup appears ONCE PER GAME SESSION maximum

ALTER TABLE user_like_prompt_tracking 
ADD COLUMN IF NOT EXISTS shown_sessions JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance on shown_sessions queries
CREATE INDEX IF NOT EXISTS idx_user_like_prompt_tracking_shown_sessions 
ON user_like_prompt_tracking USING GIN (shown_sessions);

COMMENT ON COLUMN user_like_prompt_tracking.shown_sessions IS 'Array of game session IDs where the like prompt was shown - ensures once-per-game limit';