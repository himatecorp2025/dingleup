import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOTAL_POOLS = 40;
const MIN_QUESTIONS_PER_POOL = 15;

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      return new Response(
        JSON.stringify({ error: 'Admin role required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Get ALL questions from ALL topics (mixed)
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*');

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No questions found in database' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Regenerating GLOBAL pools: ${questions.length} total questions (mixed topics)`);

    // Shuffle ALL questions using Fisher-Yates algorithm (MIXED TOPICS)
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Calculate pool distribution (~500 questions/pool)
    const totalQuestions = shuffled.length;
    const questionsPerPool = Math.floor(totalQuestions / TOTAL_POOLS);
    const remainder = totalQuestions % TOTAL_POOLS;

    console.log(`Distributing ${totalQuestions} questions into ${TOTAL_POOLS} pools (~${questionsPerPool} per pool)`);

    // Delete ALL existing pools
    const { error: deleteError } = await supabase
      .from('question_pools')
      .delete()
      .neq('pool_order', 0); // Delete all

    if (deleteError) {
      console.error('Error deleting old pools:', deleteError);
    }

    // Create 40 new GLOBAL pools with mixed topics
    const pools = [];
    let currentIndex = 0;

    for (let poolOrder = 1; poolOrder <= TOTAL_POOLS; poolOrder++) {
      // Calculate questions for this pool
      let poolSize = questionsPerPool;
      if (poolOrder <= remainder) {
        poolSize += 1; // Distribute remainder evenly
      }

      const poolQuestions = shuffled.slice(currentIndex, currentIndex + poolSize);
      currentIndex += poolSize;

      if (poolQuestions.length >= MIN_QUESTIONS_PER_POOL) {
        pools.push({
          pool_order: poolOrder,
          questions: poolQuestions,
          version: 1,
        });
      } else {
        console.log(`Pool ${poolOrder} skipped (only ${poolQuestions.length} questions, minimum is ${MIN_QUESTIONS_PER_POOL})`);
      }
    }

    console.log(`Created ${pools.length} usable pools (MIXED TOPICS)`);

    // Insert all pools
    const { data: insertedPools, error: insertError } = await supabase
      .from('question_pools')
      .insert(pools)
      .select('id, pool_order, question_count');

    if (insertError) {
      throw new Error(`Failed to insert pools: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_questions: totalQuestions,
        pools_created: pools.length,
        pools: insertedPools,
        note: 'GLOBAL pools with MIXED topics created (not topic-specific)',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error regenerating pools:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
