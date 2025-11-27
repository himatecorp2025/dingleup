-- Add rescue state management columns to game_sessions table
ALTER TABLE public.game_sessions
ADD COLUMN IF NOT EXISTS pending_rescue BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pending_rescue_session_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rescue_completed_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.game_sessions.pending_rescue IS 'Flag indicating if user is waiting for rescue payment completion';
COMMENT ON COLUMN public.game_sessions.pending_rescue_session_id IS 'Stripe checkout session ID for pending rescue payment (prevents duplicate rescue attempts)';
COMMENT ON COLUMN public.game_sessions.rescue_completed_at IS 'Timestamp when rescue payment was successfully completed and game can resume';