import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();

const QUESTIONS_PER_POOL = 500;
const MIN_QUESTIONS_PER_POOL = 15;

interface Question {
  id: string;
  topic: string;
  question: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  correct_answer: string;
}

interface QuestionTranslation {
  question_id: string;
  language_code: string;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
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

    // Check admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { topicId } = await req.json();
    if (!topicId) {
      throw new Error('topicId is required');
    }

    console.log(`[regenerate-pools] Starting regeneration for topic: ${topicId}`);

    // Use service role client for pool management
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all questions for the topic
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('topic', topicId);

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }

    if (!questions || questions.length === 0) {
      throw new Error(`No questions found for topic: ${topicId}`);
    }

    console.log(`[regenerate-pools] Found ${questions.length} questions for topic ${topicId}`);

    // Fetch all translations for these questions
    const questionIds = questions.map(q => q.id);
    const { data: translations, error: translationsError } = await supabaseAdmin
      .from('question_translations')
      .select('*')
      .in('question_id', questionIds);

    if (translationsError) {
      throw new Error(`Failed to fetch translations: ${translationsError.message}`);
    }

    // Group translations by question_id
    const translationsByQuestion = new Map<string, QuestionTranslation[]>();
    translations?.forEach((t: QuestionTranslation) => {
      if (!translationsByQuestion.has(t.question_id)) {
        translationsByQuestion.set(t.question_id, []);
      }
      translationsByQuestion.get(t.question_id)!.push(t);
    });

    // Build complete question objects with translations
    const completeQuestions = questions.map((q: Question) => ({
      id: q.id,
      topic: q.topic,
      question: q.question,
      answer_a: q.answer_a,
      answer_b: q.answer_b,
      answer_c: q.answer_c,
      correct_answer: q.correct_answer,
      translations: translationsByQuestion.get(q.id) || []
    }));

    // Shuffle questions using Fisher-Yates
    for (let i = completeQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [completeQuestions[i], completeQuestions[j]] = [completeQuestions[j], completeQuestions[i]];
    }

    // Delete existing pools for this topic
    const { error: deleteError } = await supabaseAdmin
      .from('question_pools')
      .delete()
      .eq('topic_id', topicId);

    if (deleteError) {
      console.error(`[regenerate-pools] Warning: Failed to delete old pools: ${deleteError.message}`);
    }

    // Distribute questions into pools
    const pools: any[] = [];
    let poolOrder = 1;
    let questionIndex = 0;

    while (questionIndex < completeQuestions.length) {
      const poolQuestions = completeQuestions.slice(questionIndex, questionIndex + QUESTIONS_PER_POOL);
      
      // Only create pool if it has at least MIN_QUESTIONS_PER_POOL
      if (poolQuestions.length >= MIN_QUESTIONS_PER_POOL) {
        pools.push({
          topic_id: topicId,
          pool_order: poolOrder,
          questions: poolQuestions,
          is_active: true,
          version: 1
        });
        poolOrder++;
      } else {
        console.log(`[regenerate-pools] Skipping pool ${poolOrder} - only ${poolQuestions.length} questions (min: ${MIN_QUESTIONS_PER_POOL})`);
      }

      questionIndex += QUESTIONS_PER_POOL;
    }

    console.log(`[regenerate-pools] Created ${pools.length} pools for topic ${topicId}`);

    // Insert new pools
    if (pools.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('question_pools')
        .insert(pools);

      if (insertError) {
        throw new Error(`Failed to insert pools: ${insertError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        topicId,
        totalQuestions: questions.length,
        poolsCreated: pools.length,
        questionsPerPool: pools.map(p => p.questions.length)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[regenerate-pools] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});