-- ============================================================
-- STEP 1: Extend question_pools table for bilingual cache
-- ============================================================
-- Add questions_en column to store English translations
-- This enables dual-language in-memory cache (0ms load for both HU and EN)

ALTER TABLE public.question_pools 
ADD COLUMN IF NOT EXISTS questions_en JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.question_pools.questions_en IS 
'English translations of questions - same structure as questions column but with translated text';

-- Add index for faster English question lookups (if needed)
CREATE INDEX IF NOT EXISTS idx_question_pools_questions_en 
ON public.question_pools USING GIN (questions_en);