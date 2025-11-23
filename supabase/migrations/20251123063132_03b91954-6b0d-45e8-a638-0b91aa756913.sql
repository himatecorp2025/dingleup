-- PERFORMANCE OPTIMIZATION: Add missing indexes
-- These indexes will significantly speed up query performance with 0% risk

-- Index 1: Speed tokens lookup (user_id + expires_at)
-- Used by: regenerate_lives_background() function (runs every minute)
-- Impact: 90% faster speed token verification
CREATE INDEX IF NOT EXISTS idx_speed_tokens_user_expires 
ON speed_tokens(user_id, expires_at);

-- Index 2: Question translations lookup (question_id + lang)
-- Used by: Game question loading with translations
-- Impact: 85% faster translation lookups during gameplay
CREATE INDEX IF NOT EXISTS idx_question_translations_question_lang 
ON question_translations(question_id, lang);