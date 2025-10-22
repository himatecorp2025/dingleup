-- Align life regeneration start after reset
UPDATE public.profiles
SET last_life_regeneration = now()
WHERE id IS NOT NULL;