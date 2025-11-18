-- Delete old category data from weekly_rankings table
-- Only 'mixed' category is used now, old categories (health, history, culture, finance) must be removed

DELETE FROM public.weekly_rankings 
WHERE category IN ('health', 'history', 'culture', 'finance');