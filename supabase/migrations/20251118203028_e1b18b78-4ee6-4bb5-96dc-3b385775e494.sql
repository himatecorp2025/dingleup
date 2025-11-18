-- Add UNIQUE constraint to prevent duplicate likes from same user on same question
CREATE UNIQUE INDEX IF NOT EXISTS question_likes_user_question_unique 
ON question_likes(user_id, question_id);