import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();

const MIN_QUESTIONS_PER_POOL = 15;
const QUESTIONS_PER_GAME = 15;
const MAX_POOL_ATTEMPTS = 100; // Prevent infinite loops

// In-memory cache for pools (5 minutes TTL)
const poolCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedPool(topicId: string, poolOrder: number): any | null {
  const key = `${topicId}:${poolOrder}`;
  const cached = poolCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  poolCache.delete(key);
  return null;
}

function setCachedPool(topicId: string, poolOrder: number, data: any): void {
  const key = `${topicId}:${poolOrder}`;
  poolCache.set(key, { data, timestamp: Date.now() });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { topicId, lastPoolOrder, languageCode } = await req.json();
    if (!topicId) {
      throw new Error('topicId is required');
    }

    console.log(`[get-game-questions] User: ${user.id}, Topic: ${topicId}, LastPool: ${lastPoolOrder}, Lang: ${languageCode || 'en'}`);

    // Get total number of active pools for this topic
    const { count, error: countError } = await supabaseClient
      .from('question_pools')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId)
      .eq('is_active', true);

    if (countError) {
      throw new Error(`Failed to count pools: ${countError.message}`);
    }

    if (!count || count === 0) {
      throw new Error(`No active pools found for topic: ${topicId}`);
    }

    console.log(`[get-game-questions] Found ${count} active pools for topic ${topicId}`);

    // Calculate next pool order
    let nextPoolOrder = lastPoolOrder ? ((lastPoolOrder % count) + 1) : 1;
    let attempts = 0;
    let selectedPool = null;

    // Try to find a suitable pool (skip small/empty pools)
    while (attempts < MAX_POOL_ATTEMPTS && !selectedPool) {
      attempts++;

      // Check cache first
      let pool = getCachedPool(topicId, nextPoolOrder);

      if (!pool) {
        // Fetch from database
        const { data: poolData, error: poolError } = await supabaseClient
          .from('question_pools')
          .select('*')
          .eq('topic_id', topicId)
          .eq('pool_order', nextPoolOrder)
          .eq('is_active', true)
          .single();

        if (poolError || !poolData) {
          console.log(`[get-game-questions] Pool ${nextPoolOrder} not found, trying next...`);
          nextPoolOrder = (nextPoolOrder % count) + 1;
          continue;
        }

        pool = poolData;
        setCachedPool(topicId, nextPoolOrder, pool);
      }

      // Check if pool has enough questions
      const questionCount = Array.isArray(pool.questions) ? pool.questions.length : 0;
      
      if (questionCount >= MIN_QUESTIONS_PER_POOL) {
        selectedPool = pool;
        console.log(`[get-game-questions] Selected pool ${nextPoolOrder} with ${questionCount} questions`);
      } else {
        console.log(`[get-game-questions] Pool ${nextPoolOrder} has only ${questionCount} questions (min: ${MIN_QUESTIONS_PER_POOL}), skipping...`);
        nextPoolOrder = (nextPoolOrder % count) + 1;
      }
    }

    if (!selectedPool) {
      throw new Error('No suitable pool found with enough questions');
    }

    // Select random questions from pool (Fisher-Yates in-memory)
    const poolQuestions = [...selectedPool.questions];
    const selectedQuestions = [];

    for (let i = 0; i < Math.min(QUESTIONS_PER_GAME, poolQuestions.length); i++) {
      const randomIndex = Math.floor(Math.random() * (poolQuestions.length - i)) + i;
      [poolQuestions[i], poolQuestions[randomIndex]] = [poolQuestions[randomIndex], poolQuestions[i]];
      selectedQuestions.push(poolQuestions[i]);
    }

    console.log(`[get-game-questions] Selected ${selectedQuestions.length} random questions from pool ${selectedPool.pool_order}`);

    // Format questions for the game (with translations)
    const formattedQuestions = selectedQuestions.map(q => {
      const targetLang = languageCode || 'en';
      const translation = q.translations?.find((t: any) => t.language_code === targetLang);
      
      return {
        id: q.id,
        topic: q.topic,
        question: translation?.question_text || q.question,
        answer_a: translation?.answer_a || q.answer_a,
        answer_b: translation?.answer_b || q.answer_b,
        answer_c: translation?.answer_c || q.answer_c,
        correct_answer: q.correct_answer
      };
    });

    // Update user's last pool order
    const { error: updateError } = await supabaseClient
      .from('game_session_pools')
      .upsert({
        user_id: user.id,
        topic_id: topicId,
        last_pool_order: selectedPool.pool_order,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,topic_id'
      });

    if (updateError) {
      console.error(`[get-game-questions] Failed to update session pool: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        questions: formattedQuestions,
        usedPoolOrder: selectedPool.pool_order,
        totalPools: count
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[get-game-questions] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});