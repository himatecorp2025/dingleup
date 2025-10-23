-- Add 'reviewing' status to reports table
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_status_check 
CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed'));