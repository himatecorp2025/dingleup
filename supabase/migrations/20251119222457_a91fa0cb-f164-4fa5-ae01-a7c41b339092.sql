-- Remove trigger from auth.users (reserved schema - should not have triggers)
-- This trigger is causing "Database error saving new user" during signUp
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Note: Profile creation will be handled entirely by register-with-geolocation edge function
-- No triggers should exist on auth schema tables per Supabase best practices