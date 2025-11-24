-- Function to validate question bank and return topics needing more questions
CREATE OR REPLACE FUNCTION get_topics_needing_questions()
RETURNS TABLE (
  topic_id INT,
  topic_name TEXT,
  current_count BIGINT,
  needed INT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id::INT as topic_id,
    t.name as topic_name,
    COALESCE(COUNT(q.id), 0) as current_count,
    GREATEST(0, 150 - COALESCE(COUNT(q.id), 0))::INT as needed
  FROM topics t
  LEFT JOIN questions q ON q.topic_id = t.id
  GROUP BY t.id, t.name
  ORDER BY current_count ASC, t.name;
END;
$$ LANGUAGE plpgsql;