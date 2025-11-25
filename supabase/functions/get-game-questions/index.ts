import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CRITICAL: 15 GLOBAL POOLS (pool_1 ... pool_15)
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

interface TranslatedQuestion extends Question {
  question_text_translated: string;
  answer_a_translated: string;
  answer_b_translated: string;
  answer_c_translated: string;
}

interface QuestionTranslation {
  question_id: string;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
}

interface Pool {
  id: string;
  pool_order: number;
  questions: Question[];
  question_count: number;
  version: number;
}

// ============================================================================
// IN-MEMORY POOL CACHE - ALL 15 POOLS LOADED AT STARTUP
// ============================================================================
const POOLS_MEMORY_CACHE = new Map<number, Question[]>();
let CACHE_INITIALIZED = false;
let CACHE_INIT_PROMISE: Promise<void> | null = null;

// Fisher-Yates shuffle for random question selection from memory
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize all 15 pools into memory at startup
async function initializePoolsCache(supabase: any): Promise<void> {
  if (CACHE_INITIALIZED) return;
  if (CACHE_INIT_PROMISE) return CACHE_INIT_PROMISE;

  CACHE_INIT_PROMISE = (async () => {
    console.log('[POOL CACHE] Initializing all 15 pools into memory...');
    const startTime = Date.now();

    try {
      const { data: pools, error } = await supabase
        .from('question_pools')
        .select('*')
        .gte('question_count', MIN_QUESTIONS_PER_POOL)
        .order('pool_order');

      if (error) {
        console.error('[POOL CACHE] Failed to load pools:', error);
        throw error;
      }

      if (!pools || pools.length < TOTAL_POOLS) {
        console.warn(`[POOL CACHE] Only ${pools?.length || 0} pools found, expected ${TOTAL_POOLS}`);
      }

      // Load all pools into memory
      for (const poolData of pools || []) {
        // ✅ CRITICAL FIX: Explicit JSONB[] -> Question[] parsing
        const questionsRaw = poolData.questions;
        let questions: Question[] = [];

        if (questionsRaw && Array.isArray(questionsRaw)) {
          // Parse each question object explicitly (JSONB[] conversion)
          questions = questionsRaw.map((q: any) => {
            // If string, parse JSON
            if (typeof q === 'string') {
              try {
                return JSON.parse(q);
              } catch (err) {
                console.error(`[POOL CACHE] Failed to parse question:`, err);
                return null;
              }
            }
            // If already object, return as-is
            return q;
          }).filter((q: any) => q !== null); // Remove null entries
        }

        // ✅ VALIDATION: Ensure pool has sufficient questions
        if (questions.length < MIN_QUESTIONS_PER_POOL) {
          console.error(`[POOL CACHE] ❌ Pool ${poolData.pool_order} has only ${questions.length} questions (expected ${MIN_QUESTIONS_PER_POOL})`);
        } else {
          console.log(`[POOL CACHE] ✅ Pool ${poolData.pool_order} loaded: ${questions.length} questions`);
        }

        POOLS_MEMORY_CACHE.set(poolData.pool_order, questions);
      }

      CACHE_INITIALIZED = true;
      const elapsed = Date.now() - startTime;
      console.log(`[POOL CACHE] ✅ All pools loaded in ${elapsed}ms. Total pools: ${POOLS_MEMORY_CACHE.size}`);
    } catch (err) {
      console.error('[POOL CACHE] Initialization failed:', err);
      CACHE_INIT_PROMISE = null;
      throw err;
    }
  })();

  return CACHE_INIT_PROMISE;
}

// Select 15 random questions from pool (in-memory, 0-5ms)
function selectRandomQuestionsFromMemory(poolQuestions: Question[], count: number): Question[] {
  if (poolQuestions.length <= count) {
    return fisherYatesShuffle(poolQuestions);
  }
  
  // Fisher-Yates shuffle and take first 'count' items
  const shuffled = fisherYatesShuffle(poolQuestions);
  return shuffled.slice(0, count);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize pool cache if not already done
    await initializePoolsCache(supabase);

    const { last_pool_order, lang = 'en' } = await req.json();

    // Calculate next pool (global rotation 1-15)
    let nextPoolOrder = 1;
    if (last_pool_order && typeof last_pool_order === 'number') {
      nextPoolOrder = (last_pool_order % TOTAL_POOLS) + 1;
    }

    console.log(`[get-game-questions] Requesting pool ${nextPoolOrder}, lang: ${lang}`);

    // Get pool questions from in-memory cache (instant, <1ms)
    const poolQuestions = POOLS_MEMORY_CACHE.get(nextPoolOrder);
    
    if (!poolQuestions || poolQuestions.length < MIN_QUESTIONS_PER_POOL) {
      console.error(`[get-game-questions] Pool ${nextPoolOrder} not in cache or insufficient questions`);
      
      // Fallback: load from database
      const { data: fallbackQuestions } = await supabase
        .from('questions')
        .select('*')
        .limit(100);

      if (!fallbackQuestions || fallbackQuestions.length < QUESTIONS_PER_GAME) {
        throw new Error('No questions available');
      }

      console.log(`[get-game-questions] Using fallback: ${fallbackQuestions.length} questions`);
      const randomQuestions = selectRandomQuestionsFromMemory(fallbackQuestions as Question[], QUESTIONS_PER_GAME);
      const translatedFallback = await translateQuestions(supabase, randomQuestions, lang);
      return new Response(
        JSON.stringify({ questions: translatedFallback, used_pool_order: null, fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select 15 random questions from pool (in-memory, <5ms)
    const startSelect = Date.now();
    const selectedQuestions = selectRandomQuestionsFromMemory(poolQuestions, QUESTIONS_PER_GAME);
    const selectTime = Date.now() - startSelect;
    
    console.log(`[get-game-questions] Selected ${selectedQuestions.length} questions from pool ${nextPoolOrder} in ${selectTime}ms`);

    // Translate questions to target language
    const translatedQuestions = await translateQuestions(supabase, selectedQuestions, lang);

    return new Response(
      JSON.stringify({
        questions: translatedQuestions,
        used_pool_order: nextPoolOrder,
        fallback: false,
        performance: {
          selection_time_ms: selectTime,
          cache_hit: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', questions: [], used_pool_order: null, fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});


async function translateQuestions(
  supabase: any,
  questions: Question[],
  lang: string
): Promise<TranslatedQuestion[]> {
  // If Hungarian, no translation needed - return original
  if (lang === 'hu') {
    return questions.map(q => ({
      ...q,
      question_text_translated: q.question,
      answer_a_translated: q.answers[0]?.text || '',
      answer_b_translated: q.answers[1]?.text || '',
      answer_c_translated: q.answers[2]?.text || '',
    }));
  }

  const questionIds = questions.map(q => q.id);
  
  // Fetch translations for all questions in one query
  const { data: translations } = await supabase
    .from('question_translations')
    .select('question_id, question_text, answer_a, answer_b, answer_c')
    .in('question_id', questionIds)
    .eq('lang', lang);

  if (!translations) {
    // Fallback to Hungarian if translations not found
    console.warn(`Translations not found for lang: ${lang}, using Hungarian`);
    return questions.map(q => ({
      ...q,
      question_text_translated: q.question,
      answer_a_translated: q.answers[0]?.text || '',
      answer_b_translated: q.answers[1]?.text || '',
      answer_c_translated: q.answers[2]?.text || '',
    }));
  }

  // Create a map of translations by question_id
  const translationMap = new Map<string, QuestionTranslation>(
    (translations as QuestionTranslation[]).map((t: QuestionTranslation) => [t.question_id, t])
  );

  // Merge original questions with translations
  return questions.map(q => {
    const translation = translationMap.get(q.id);
    return {
      ...q,
      question_text_translated: translation?.question_text || q.question,
      answer_a_translated: translation?.answer_a || q.answers[0]?.text || '',
      answer_b_translated: translation?.answer_b || q.answers[1]?.text || '',
      answer_c_translated: translation?.answer_c || q.answers[2]?.text || '',
    } as TranslatedQuestion;
  });
}
