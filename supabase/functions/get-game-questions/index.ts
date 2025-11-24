import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MIN_QUESTIONS_PER_POOL = 15;
const QUESTIONS_PER_GAME = 15;
const MAX_POOL_ROTATION_ATTEMPTS = 50; // Prevent infinite loops

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

interface Pool {
  id: string;
  topic_id: number;
  pool_order: number;
  questions: Question[];
  question_count: number;
}

// In-memory cache for pools (Edge Function memory)
const poolCache = new Map<string, { pool: Pool; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { topic_id, last_pool_order } = await req.json();

    if (!topic_id) {
      return new Response(
        JSON.stringify({ error: 'topic_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Getting questions for topic ${topic_id}, last_pool_order: ${last_pool_order}`);

    // Get total pool count for this topic (with min question requirement)
    const { data: poolCounts, error: countError } = await supabase
      .from('question_pools')
      .select('pool_order', { count: 'exact', head: false })
      .eq('topic_id', topic_id)
      .gte('question_count', MIN_QUESTIONS_PER_POOL)
      .order('pool_order', { ascending: true });

    if (countError) {
      throw new Error(`Failed to get pool count: ${countError.message}`);
    }

    if (!poolCounts || poolCounts.length === 0) {
      // Fallback: no pools available, return random questions from questions table
      console.warn(`No pools found for topic ${topic_id}, falling back to random selection`);
      
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topic_id)
        .limit(100);

      if (questionsError || !questions || questions.length < QUESTIONS_PER_GAME) {
        return new Response(
          JSON.stringify({ error: 'Not enough questions available for this topic' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Shuffle and select
      const shuffled = shuffleArray([...questions]);
      const selected = shuffled.slice(0, QUESTIONS_PER_GAME);

      return new Response(
        JSON.stringify({
          questions: selected,
          used_pool_order: null,
          fallback: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalPools = poolCounts.length;
    const availablePoolOrders = poolCounts.map(p => p.pool_order);

    console.log(`Found ${totalPools} usable pools for topic ${topic_id}`);

    // Calculate next pool order with rotation
    let nextPoolOrder: number;
    if (last_pool_order === null || last_pool_order === undefined) {
      // First game: start with pool 1 or first available
      nextPoolOrder = availablePoolOrders[0];
    } else {
      // Find current pool index
      const currentIndex = availablePoolOrders.indexOf(last_pool_order);
      if (currentIndex === -1) {
        // Last pool not found, start from beginning
        nextPoolOrder = availablePoolOrders[0];
      } else {
        // Get next pool with wrap-around
        const nextIndex = (currentIndex + 1) % availablePoolOrders.length;
        nextPoolOrder = availablePoolOrders[nextIndex];
      }
    }

    console.log(`Selected pool order: ${nextPoolOrder}`);

    // Try to load pool from cache first
    const cacheKey = `${topic_id}_${nextPoolOrder}`;
    const cached = poolCache.get(cacheKey);
    let pool: Pool | null = null;

    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      console.log(`Cache HIT for ${cacheKey}`);
      pool = cached.pool;
    } else {
      console.log(`Cache MISS for ${cacheKey}, fetching from DB`);
      
      // Load pool from database
      const { data: poolData, error: poolError } = await supabase
        .from('question_pools')
        .select('*')
        .eq('topic_id', topic_id)
        .eq('pool_order', nextPoolOrder)
        .gte('question_count', MIN_QUESTIONS_PER_POOL)
        .single();

      if (poolError || !poolData) {
        throw new Error(`Failed to load pool: ${poolError?.message || 'Pool not found'}`);
      }

      pool = poolData as unknown as Pool;
      
      // Cache the pool
      poolCache.set(cacheKey, { pool, timestamp: Date.now() });
    }

    // Select random questions from pool (in-memory shuffle)
    const poolQuestions = pool.questions as Question[];
    
    if (poolQuestions.length < QUESTIONS_PER_GAME) {
      return new Response(
        JSON.stringify({ error: 'Pool has insufficient questions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Fisher-Yates shuffle and select first N
    const selectedQuestions = selectRandomQuestions(poolQuestions, QUESTIONS_PER_GAME);

    console.log(`Returning ${selectedQuestions.length} questions from pool ${nextPoolOrder}`);

    return new Response(
      JSON.stringify({
        questions: selectedQuestions,
        used_pool_order: nextPoolOrder,
        fallback: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting game questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Select N random questions without full shuffle (more efficient)
function selectRandomQuestions(questions: Question[], count: number): Question[] {
  if (questions.length <= count) {
    return shuffleArray(questions);
  }

  const selected: Question[] = [];
  const indices = new Set<number>();

  while (selected.length < count) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    if (!indices.has(randomIndex)) {
      indices.add(randomIndex);
      selected.push(questions[randomIndex]);
    }
  }

  return selected;
}
