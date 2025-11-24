-- Create helper function to get topics needing questions
CREATE OR REPLACE FUNCTION get_topics_needing_questions()
RETURNS TABLE (
  topic_id INT,
  topic_name TEXT,
  current_count BIGINT,
  needed INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id::INT as topic_id,
    t.name as topic_name,
    COUNT(qt.question_id) as current_count,
    (100 - COUNT(qt.question_id)::INT) as needed
  FROM topics t
  LEFT JOIN questions q ON q.topic_id = t.id
  LEFT JOIN question_translations qt ON qt.question_id = q.id AND qt.lang = 'hu'
  GROUP BY t.id, t.name
  HAVING COUNT(qt.question_id) < 100
  ORDER BY t.name;
END;
$$;