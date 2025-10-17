-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly rankings calculation to run every hour
SELECT cron.schedule(
  'calculate-weekly-rankings',
  '0 * * * *', -- Every hour
  $$
  SELECT
    net.http_post(
        url:='https://wdpxmwsxhckazwxufttk.supabase.co/functions/v1/calculate-weekly-rankings',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcHhtd3N4aGNrYXp3eHVmdHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDQ3ODUsImV4cCI6MjA3NjE4MDc4NX0.DeAS4ACvq-YVt2ytoOS3NVSg7xFSHVhvyjUEOti_NnA"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
