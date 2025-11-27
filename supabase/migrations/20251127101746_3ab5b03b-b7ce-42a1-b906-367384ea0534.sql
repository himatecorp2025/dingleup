-- Fix timestamp comparison error in performance_metrics RLS policies
-- Error: "operator does not exist: timestamp with time zone > time with time zone"

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own performance metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Users can insert own performance metrics" ON performance_metrics;

-- Recreate policies with correct timestamp handling
CREATE POLICY "Users can view own performance metrics"
ON performance_metrics
FOR SELECT
USING (
  auth.uid() = user_id
);

CREATE POLICY "Users can insert own performance metrics"
ON performance_metrics
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_created 
ON performance_metrics(user_id, created_at DESC);

-- Log fix
DO $$
BEGIN
  RAISE NOTICE '[SelfHealing] Fixed timestamp comparison in performance_metrics RLS policies';
END $$;