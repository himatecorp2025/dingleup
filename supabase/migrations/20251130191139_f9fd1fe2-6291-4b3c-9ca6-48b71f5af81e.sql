-- Fix function search_path for tutorial_progress trigger function
ALTER FUNCTION update_tutorial_progress_updated_at() SET search_path = public;