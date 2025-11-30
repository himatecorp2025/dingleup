import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitExceeded, RATE_LIMITS } from '../_shared/rateLimit.ts';

// ============================================================================
// OPTIMIZED GAME SESSION START - NO NESTED CALLS, DIRECT POOL ACCESS
// ============================================================================

const TOTAL_POOLS = 15;
const MIN_QUESTIONS_PER_POOL = 300;
const QUESTIONS_PER_GAME = 15;

interface Question {
  id: string;
  question: string;
  answers: any[];
  audience: number[];
  third: string;
  topic_id: number;
  source_category: string;
  correct_answer: string;
}

// ============================================================================
// IN-MEMORY DUAL-LANGUAGE POOL CACHE (HU + EN)
// ============================================================================
const POOLS_CACHE_HU = new Map<number, Question[]>();
const POOLS_CACHE_EN = new Map<number, Question[]>();
let CACHE_INITIALIZED = false;
let CACHE_INIT_PROMISE: Promise<void> | null = null;

// Fisher-Yates shuffle
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize dual-language pool cache
async function initializePoolsCache(supabase: any): Promise<void> {
  if (CACHE_INITIALIZED) return;
  if (CACHE_INIT_PROMISE) return CACHE_INIT_PROMISE;

  CACHE_INIT_PROMISE = (async () => {
    console.log('[POOL CACHE] Initializing all 15 pools (HU + EN) into memory...');
    const startTime = Date.now();

    try {
      const { data: pools, error } = await supabase
        .from('question_pools')
        .select('*')
        .gte('question_count', MIN_QUESTIONS_PER_POOL)
        .order('pool_order');

      if (error) throw error;
      if (!pools || pools.length < TOTAL_POOLS) {
        console.warn(`[POOL CACHE] Only ${pools?.length || 0} pools found`);
      }

      for (const poolData of pools || []) {
        const poolOrder = poolData.pool_order;

        // Parse Hungarian questions
        const questionsRawHu = poolData.questions;
        let questionsHu: Question[] = [];
        if (questionsRawHu && Array.isArray(questionsRawHu)) {
          questionsHu = questionsRawHu.map((q: any) => 
            typeof q === 'string' ? JSON.parse(q) : q
          ).filter((q: any) => q !== null);
        }

        // Parse English questions
        const questionsRawEn = poolData.questions_en;
        let questionsEn: Question[] = [];
        if (questionsRawEn && Array.isArray(questionsRawEn)) {
          questionsEn = questionsRawEn.map((q: any) => 
            typeof q === 'string' ? JSON.parse(q) : q
          ).filter((q: any) => q !== null);
        }

        POOLS_CACHE_HU.set(poolOrder, questionsHu);
        POOLS_CACHE_EN.set(poolOrder, questionsEn);
        
        console.log(`[POOL CACHE] Pool ${poolOrder}: HU=${questionsHu.length}, EN=${questionsEn.length}`);
      }

      CACHE_INITIALIZED = true;
      const elapsed = Date.now() - startTime;
      console.log(`[POOL CACHE] ✅ Cache loaded in ${elapsed}ms`);
    } catch (err) {
      console.error('[POOL CACHE] Init failed:', err);
      CACHE_INIT_PROMISE = null;
      throw err;
    }
  })();

  return CACHE_INIT_PROMISE;
}

// Select random questions from pool
function selectRandomQuestions(poolQuestions: Question[], count: number): Question[] {
  if (poolQuestions.length <= count) {
    return fisherYatesShuffle(poolQuestions);
  }
  return fisherYatesShuffle(poolQuestions).slice(0, count);
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { 
            Authorization: authHeader,
            'X-Connection-Pooler': 'true',
          },
        },
        auth: { persistSession: false },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rateLimitResult = await checkRateLimit(supabaseClient, 'start-game-session', RATE_LIMITS.GAME);
    if (!rateLimitResult.allowed) {
      return rateLimitExceeded(corsHeaders);
    }

    console.log(`[start-game-session] User ${user.id} starting game`);

    // Parse request body for lang
    let requestBody: { lang?: string } = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (e) {
      console.warn('[start-game-session] Could not parse body');
    }

    // ========== CRITICAL OPTIMIZATION: PARALLEL DB QUERIES ==========
    const startParallel = Date.now();
    
    const [
      { data: userProfile },
      { data: poolSession }
    ] = await Promise.all([
      supabaseClient
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .single(),
      supabaseClient
        .from('game_session_pools')
        .select('last_pool_order')
        .eq('user_id', user.id)
        .single()
    ]);

    const parallelElapsed = Date.now() - startParallel;
    console.log(`[start-game-session] Parallel queries: ${parallelElapsed}ms`);

    const userLang = requestBody.lang || userProfile?.preferred_language || 'en';
    const lastPoolOrder = poolSession?.last_pool_order || null;
    
    console.log(`[start-game-session] User ${user.id} pool: ${lastPoolOrder}, lang: ${userLang}`);

    // ========== INITIALIZE CACHE IF NEEDED ==========
    await initializePoolsCache(supabaseClient);

    // ========== POOL ROTATION LOGIC ==========
    let nextPoolOrder = 1;
    if (lastPoolOrder && typeof lastPoolOrder === 'number') {
      nextPoolOrder = (lastPoolOrder % TOTAL_POOLS) + 1;
    }

    console.log(`[start-game-session] Using pool ${nextPoolOrder}, lang: ${userLang}`);

    // ========== SELECT LANGUAGE-SPECIFIC CACHE ==========
    const poolCache = userLang === 'en' ? POOLS_CACHE_EN : POOLS_CACHE_HU;
    const poolQuestions = poolCache.get(nextPoolOrder);

    if (!poolQuestions || poolQuestions.length < MIN_QUESTIONS_PER_POOL) {
      console.error(`[start-game-session] Pool ${nextPoolOrder} (${userLang}) insufficient questions`);
      return new Response(
        JSON.stringify({ error: `Pool ${nextPoolOrder} not available` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== SELECT 15 RANDOM QUESTIONS (0-5ms, NO DB) ==========
    const startSelect = Date.now();
    const selectedQuestions = selectRandomQuestions(poolQuestions, QUESTIONS_PER_GAME);
    const selectElapsed = Date.now() - startSelect;
    
    console.log(`[start-game-session] Selected ${selectedQuestions.length} questions in ${selectElapsed}ms (ZERO DB)`);

    // ========== UPDATE POOL SESSION ==========
    await supabaseClient
      .from('game_session_pools')
      .upsert({
        user_id: user.id,
        last_pool_order: nextPoolOrder,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    // ========== CREATE GAME SESSION ==========
    const sessionId = crypto.randomUUID();
    const sessionData = {
      user_id: user.id,
      session_id: sessionId,
      category: 'mixed',
      questions: selectedQuestions.map((q: any) => ({
        id: q.id,
        question: q.question,
        correctAnswer: q.answers.findIndex((a: any) => a.correct),
        difficulty: 'medium'
      })),
      current_question: 0,
      correct_answers: 0,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    const { error: insertError } = await supabaseClient
      .from('game_sessions')
      .insert(sessionData);

    if (insertError) {
      console.error('[start-game-session] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create game session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[start-game-session] ✅ Session ${sessionId} created (pool ${nextPoolOrder}, lang: ${userLang})`);

    return new Response(
      JSON.stringify({ 
        sessionId,
        questions: selectedQuestions,
        poolUsed: nextPoolOrder,
        lang: userLang,
        performance: {
          parallel_queries_ms: parallelElapsed,
          question_selection_ms: selectElapsed,
          db_queries_for_questions: 0 // ZERO!
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[start-game-session] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});