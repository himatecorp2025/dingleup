-- Add online presence tracking
CREATE TABLE public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Everyone can see who's online
CREATE POLICY "Anyone can view user presence"
ON public.user_presence FOR SELECT
USING (true);

-- Users can update their own presence
CREATE POLICY "Users can update their own presence"
ON public.user_presence FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence status"
ON public.user_presence FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Function to automatically mark users as offline after 5 minutes
CREATE OR REPLACE FUNCTION mark_users_offline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_presence
  SET is_online = false
  WHERE last_seen < NOW() - INTERVAL '5 minutes'
  AND is_online = true;
END;
$$;

-- Add message retention metadata
ALTER TABLE public.messages
ADD COLUMN is_reported BOOLEAN DEFAULT false,
ADD COLUMN retention_until TIMESTAMP WITH TIME ZONE;

-- Function to set retention dates on messages
CREATE OR REPLACE FUNCTION set_message_retention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normal messages: 90 days
  NEW.retention_until := NEW.created_at + INTERVAL '90 days';
  RETURN NEW;
END;
$$;

CREATE TRIGGER message_retention_trigger
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION set_message_retention();

-- Function to extend retention for reported messages
CREATE OR REPLACE FUNCTION extend_reported_message_retention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.report_type = 'user_behavior' AND NEW.reported_message_id IS NOT NULL THEN
    -- Extend to 5 years for reported messages
    UPDATE messages
    SET is_reported = true,
        retention_until = NOW() + INTERVAL '5 years'
    WHERE id = NEW.reported_message_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER extend_retention_on_report
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION extend_reported_message_retention();

-- Function to clean old messages (should be called by cron)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM messages
  WHERE retention_until < NOW();
END;
$$;

-- Add indexes for better search performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_invitation_code ON profiles(invitation_code);
CREATE INDEX idx_messages_retention ON messages(retention_until);
CREATE INDEX idx_user_presence_online ON user_presence(is_online, last_seen);