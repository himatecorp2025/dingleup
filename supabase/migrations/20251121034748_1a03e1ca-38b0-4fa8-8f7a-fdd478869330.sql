-- Fix RLS policies for question_translations table
-- Service role needs full access for AI translation generation

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Allow service role full access" ON public.question_translations;

-- Disable RLS for question_translations (backend-only table)
-- This table is only accessed by edge functions with service role key
-- No direct user access needed
ALTER TABLE public.question_translations DISABLE ROW LEVEL SECURITY;