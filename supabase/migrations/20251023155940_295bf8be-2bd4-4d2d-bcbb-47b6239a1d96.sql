-- Allow empty body in dm_messages if media is attached
ALTER TABLE public.dm_messages 
DROP CONSTRAINT IF EXISTS dm_messages_body_check;

-- Add new constraint that allows empty body (will be validated in app logic)
ALTER TABLE public.dm_messages 
ADD CONSTRAINT dm_messages_body_check 
CHECK (
  length(trim(body)) > 0 OR body = ''
);