
-- ============================================================================
-- DINGLEUP! 15-POOL SYSTEM MIGRATION (FINAL)
-- ============================================================================
-- Létrehozza a végleges 15 medencét (pool_1...pool_15)
-- Minden medence 300 kérdést tartalmaz (30 témakör × 10 kérdés)
-- ============================================================================

-- 1) Töröljük a meglévő poolokat
TRUNCATE TABLE question_pools;

-- 2) Létrehozzuk a 15 medencét
DO $$
DECLARE
  pool_num INTEGER;
  topic_rec RECORD;
  questions_for_pool JSONB[];
  question_batch JSONB[];
  offset_val INTEGER;
BEGIN
  -- Minden medencéhez (1-15)
  FOR pool_num IN 1..15 LOOP
    questions_for_pool := ARRAY[]::JSONB[];
    
    -- Minden témakörből (1-30)
    FOR topic_rec IN SELECT id FROM topics ORDER BY id LOOP
      -- Számoljuk ki, hogy melyik 10 kérdést válasszuk
      -- pool_1: 1-10, pool_2: 11-20, ..., pool_15: 141-150
      offset_val := (pool_num - 1) * 10;
      
      -- Válasszuk ki az adott témakör megfelelő 10 kérdését JSONB formában
      SELECT ARRAY_AGG(to_jsonb(q.*) ORDER BY q.created_at)
      INTO question_batch
      FROM (
        SELECT id, question, answers, audience, third, topic_id, source_category, created_at, like_count, dislike_count, correct_answer
        FROM questions
        WHERE topic_id = topic_rec.id
        ORDER BY created_at
        LIMIT 10
        OFFSET offset_val
      ) q;
      
      -- Hozzáadjuk ezeket a medence kérdéseihez
      IF question_batch IS NOT NULL THEN
        questions_for_pool := questions_for_pool || question_batch;
      END IF;
    END LOOP;
    
    -- Beszúrjuk a medencét (question_count automatikusan generálódik)
    INSERT INTO question_pools (pool_order, questions, version)
    VALUES (
      pool_num,
      questions_for_pool,
      1
    );
    
    RAISE NOTICE 'Pool % created with % questions', pool_num, ARRAY_LENGTH(questions_for_pool, 1);
  END LOOP;
END $$;

-- 3) Ellenőrizzük az eredményt
DO $$
DECLARE
  pool_rec RECORD;
  validation_passed BOOLEAN := TRUE;
  total_pools INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_pools FROM question_pools;
  
  IF total_pools != 15 THEN
    RAISE WARNING '✗ Expected 15 pools, found %', total_pools;
    validation_passed := FALSE;
  END IF;
  
  FOR pool_rec IN SELECT pool_order, question_count FROM question_pools ORDER BY pool_order LOOP
    IF pool_rec.question_count != 300 THEN
      RAISE WARNING '✗ Pool % has % questions (expected 300)', pool_rec.pool_order, pool_rec.question_count;
      validation_passed := FALSE;
    END IF;
  END LOOP;
  
  IF validation_passed THEN
    RAISE NOTICE '✓ SUCCESS: All 15 pools created with 300 questions each (4500 total)';
  ELSE
    RAISE WARNING '✗ Pool validation failed';
  END IF;
END $$;
