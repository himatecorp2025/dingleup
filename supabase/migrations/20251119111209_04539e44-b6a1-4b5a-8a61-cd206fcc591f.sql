-- Add birth_date column to profiles table
ALTER TABLE public.profiles
ADD COLUMN birth_date DATE;

-- Set default birth date for existing users
UPDATE public.profiles
SET birth_date = '1991-05-05'
WHERE birth_date IS NULL;

-- Make birth_date NOT NULL after backfilling
ALTER TABLE public.profiles
ALTER COLUMN birth_date SET NOT NULL;