-- Fix weekly_winners_popup_views table to support ON CONFLICT upsert
-- Add unique constraint on user_id to allow ON CONFLICT('user_id')
ALTER TABLE public.weekly_winners_popup_views
ADD CONSTRAINT weekly_winners_popup_views_user_id_key UNIQUE (user_id);