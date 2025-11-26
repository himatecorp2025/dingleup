-- Extend daily_winner_awarded table with claim status and reward payload
ALTER TABLE daily_winner_awarded
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'lost')),
ADD COLUMN IF NOT EXISTS is_sunday_jackpot BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reward_payload JSONB,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster pending reward lookups
CREATE INDEX IF NOT EXISTS idx_daily_winner_awarded_user_status 
ON daily_winner_awarded(user_id, day_date, status);

-- Add comment explaining the status field
COMMENT ON COLUMN daily_winner_awarded.status IS 'pending: waiting for user to claim, claimed: reward credited, lost: user dismissed without claiming';

-- Update existing records to 'claimed' status (they were auto-credited in old system)
UPDATE daily_winner_awarded 
SET status = 'claimed', claimed_at = awarded_at 
WHERE status = 'pending' AND awarded_at < NOW();