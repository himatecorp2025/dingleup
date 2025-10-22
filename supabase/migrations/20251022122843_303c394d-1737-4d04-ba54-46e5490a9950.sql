-- Extend friendships table with status and request tracking
ALTER TABLE friendships 
ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Update existing friendships to have active status
UPDATE friendships SET status = 'active' WHERE status IS NULL OR status = '';

-- Add constraint for valid status values
ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_status_check;
ALTER TABLE friendships ADD CONSTRAINT friendships_status_check 
CHECK (status IN ('pending', 'active', 'blocked', 'declined'));

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_requested_by ON friendships(requested_by);

-- Create friend_requests view for easier querying
CREATE OR REPLACE VIEW friend_requests AS
SELECT 
  f.id,
  f.user_id_a,
  f.user_id_b,
  f.requested_by,
  f.status,
  f.created_at,
  f.updated_at,
  CASE 
    WHEN f.requested_by = f.user_id_a THEN f.user_id_b
    ELSE f.user_id_a
  END as receiver_id,
  pa.username as requester_name,
  pa.avatar_url as requester_avatar,
  pb.username as receiver_name,
  pb.avatar_url as receiver_avatar
FROM friendships f
LEFT JOIN profiles pa ON pa.id = f.requested_by
LEFT JOIN profiles pb ON pb.id = (CASE WHEN f.requested_by = f.user_id_a THEN f.user_id_b ELSE f.user_id_a END)
WHERE f.status IN ('pending', 'declined');

-- Update RLS policies for friendships to handle pending requests
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
CREATE POLICY "Users can view their friendships"
ON friendships FOR SELECT
USING (
  auth.uid() = user_id_a OR auth.uid() = user_id_b
);

DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
CREATE POLICY "Users can create friendships"
ON friendships FOR INSERT
WITH CHECK (
  (auth.uid() = user_id_a OR auth.uid() = user_id_b) AND
  requested_by = auth.uid()
);

DROP POLICY IF EXISTS "Users can update their friendships" ON friendships;
CREATE POLICY "Users can update their friendships"
ON friendships FOR UPDATE
USING (
  auth.uid() = user_id_a OR auth.uid() = user_id_b
);

-- Add rate limiting table for friend requests
CREATE TABLE IF NOT EXISTS friend_request_rate_limit (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_request_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target_user_id)
);

-- RLS for rate limit table
ALTER TABLE friend_request_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits"
ON friend_request_rate_limit FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
ON friend_request_rate_limit FOR ALL
USING (true)
WITH CHECK (true);