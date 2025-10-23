-- Add message_seq column for stable message ordering
ALTER TABLE public.dm_messages 
ADD COLUMN message_seq BIGINT GENERATED ALWAYS AS IDENTITY;

-- Create index for faster ordering queries
CREATE INDEX idx_dm_messages_thread_seq ON public.dm_messages(thread_id, message_seq);

-- Add comment explaining the column
COMMENT ON COLUMN public.dm_messages.message_seq IS 'Monotonically increasing sequence number per thread for stable message ordering';
