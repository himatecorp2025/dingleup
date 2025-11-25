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

// In-memory cache for pools (5 minute TTL)
const poolCache = new Map<number, { pool: Pool; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { last_pool_order, lang = 'en' } = await req.json();

    // Calculate next pool (global rotation 1-50)
    let nextPoolOrder = 1;
    if (last_pool_order && typeof last_pool_order === 'number') {
      nextPoolOrder = (last_pool_order % TOTAL_POOLS) + 1;
    }

    // Try to find a valid pool
    let selectedPool: Pool | null = null;
    let attempts = 0;
    let currentPoolOrder = nextPoolOrder;

    while (attempts < TOTAL_POOLS && !selectedPool) {
      const cached = poolCache.get(currentPoolOrder);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        if (cached.pool.question_count >= MIN_QUESTIONS_PER_POOL) {
          selectedPool = cached.pool;
          break;
        }
      } else {
        const { data: pools } = await supabase
          .from('question_pools')
          .select('*')
          .eq('pool_order', currentPoolOrder)
          .gte('question_count', MIN_QUESTIONS_PER_POOL)
          .limit(1);

        if (pools && pools.length > 0) {
          selectedPool = pools[0] as Pool;
          poolCache.set(currentPoolOrder, { pool: selectedPool, timestamp: Date.now() });
          break;
        }
      }

      currentPoolOrder = (currentPoolOrder % TOTAL_POOLS) + 1;
      attempts++;
    }

    if (!selectedPool) {
      const { data: fallbackQuestions } = await supabase
        .from('questions')
        .select('*')
        .limit(100);

      if (!fallbackQuestions || fallbackQuestions.length < QUESTIONS_PER_GAME) {
        throw new Error('No questions available');
      }

      const randomQuestions = selectRandomQuestions(fallbackQuestions as Question[], QUESTIONS_PER_GAME);
      const translatedFallback = await translateQuestions(supabase, randomQuestions, lang);
      return new Response(
        JSON.stringify({ questions: translatedFallback, used_pool_order: null, fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selectedQuestions = selectRandomQuestions(selectedPool.questions, QUESTIONS_PER_GAME);
    const translatedQuestions = await translateQuestions(supabase, selectedQuestions, lang);

    return new Response(
      JSON.stringify({
        questions: translatedQuestions,
        used_pool_order: selectedPool.pool_order,
        fallback: false,
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

function selectRandomQuestions(questions: Question[], count: number): Question[] {
  if (questions.length <= count) {
    return [...questions].sort(() => Math.random() - 0.5);
  }
  const selected = new Set<number>();
  const result: Question[] = [];
  while (result.length < count) {
    const idx = Math.floor(Math.random() * questions.length);
    if (!selected.has(idx)) {
      selected.add(idx);
      result.push(questions[idx]);
    }
  }
  return result;
}

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
