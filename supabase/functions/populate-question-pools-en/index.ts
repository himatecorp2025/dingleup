import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// ONE-TIME SCRIPT: Populate questions_en column in question_pools
// ============================================================================
// This script fetches all 15 pools, translates their questions to English,
// and stores them in the questions_en column for dual-language cache.

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

interface QuestionTranslation {
  question_id: string;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    console.log('[populate-pools-en] Starting English translation population...');
    const startTime = Date.now();

    // Fetch all pools
    const { data: pools, error: poolsError } = await supabase
      .from('question_pools')
      .select('*')
      .order('pool_order');

    if (poolsError) {
      throw new Error(`Failed to fetch pools: ${poolsError.message}`);
    }

    if (!pools || pools.length === 0) {
      throw new Error('No pools found in database');
    }

    console.log(`[populate-pools-en] Found ${pools.length} pools to process`);

    let totalQuestionsProcessed = 0;
    let poolsUpdated = 0;

    // Process each pool
    for (const pool of pools) {
      const poolStartTime = Date.now();
      console.log(`[populate-pools-en] Processing pool ${pool.pool_order}...`);

      // Parse Hungarian questions from pool
      const questionsHu: Question[] = pool.questions || [];
      
      if (questionsHu.length === 0) {
        console.warn(`[populate-pools-en] Pool ${pool.pool_order} has no questions, skipping`);
        continue;
      }

      // Extract question IDs
      const questionIds = questionsHu.map((q: Question) => q.id);

      // Fetch English translations for all questions in this pool
      const { data: translations, error: transError } = await supabase
        .from('question_translations')
        .select('question_id, question_text, answer_a, answer_b, answer_c')
        .in('question_id', questionIds)
        .eq('lang', 'en');

      if (transError) {
        console.error(`[populate-pools-en] Translation error for pool ${pool.pool_order}:`, transError);
        continue;
      }

      if (!translations || translations.length === 0) {
        console.warn(`[populate-pools-en] No English translations found for pool ${pool.pool_order}`);
        continue;
      }

      // Create translation map
      const translationMap = new Map<string, QuestionTranslation>(
        (translations as QuestionTranslation[]).map((t: QuestionTranslation) => [t.question_id, t])
      );

      // Apply translations to questions
      const questionsEn: Question[] = questionsHu.map((q: Question) => {
        const translation = translationMap.get(q.id);
        
        if (!translation) {
          // No translation found - keep Hungarian as fallback
          console.warn(`[populate-pools-en] No translation for question ${q.id} in pool ${pool.pool_order}`);
          return q;
        }

        // Apply English translations
        return {
          ...q,
          question: translation.question_text,
          answers: [
            { ...q.answers[0], text: translation.answer_a },
            { ...q.answers[1], text: translation.answer_b },
            { ...q.answers[2], text: translation.answer_c },
          ]
        };
      });

      // Update pool with English questions
      const { error: updateError } = await supabase
        .from('question_pools')
        .update({ questions_en: questionsEn })
        .eq('id', pool.id);

      if (updateError) {
        console.error(`[populate-pools-en] Update error for pool ${pool.pool_order}:`, updateError);
        continue;
      }

      const poolElapsed = Date.now() - poolStartTime;
      totalQuestionsProcessed += questionsEn.length;
      poolsUpdated++;

      console.log(
        `[populate-pools-en] ✅ Pool ${pool.pool_order} updated: ` +
        `${questionsEn.length} questions translated in ${poolElapsed}ms`
      );
    }

    const totalElapsed = Date.now() - startTime;

    const result = {
      success: true,
      pools_updated: poolsUpdated,
      total_questions: totalQuestionsProcessed,
      elapsed_ms: totalElapsed,
      message: `Successfully populated English translations for ${poolsUpdated} pools (${totalQuestionsProcessed} questions) in ${totalElapsed}ms`
    };

    console.log('[populate-pools-en] COMPLETE:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[populate-pools-en] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});