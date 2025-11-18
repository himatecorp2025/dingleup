import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface Question {
  question: string;
  answers: string[];
  correctAnswer: number;
  difficulty: string;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load questions from database
    console.log('[start-game-session] Loading questions from database...');
    
    const { data: questions, error: questionsError } = await supabaseClient
      .from('questions')
      .select('id, question, answers, audience, third, source_category')
      .limit(1000); // Get all available questions

    if (questionsError || !questions || questions.length === 0) {
      console.error('[start-game-session] Error loading questions:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to load questions from database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[start-game-session] Loaded ${questions.length} questions from database`);

    // Select 15 random questions
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 15).map((q: any) => ({
      id: q.id,
      question: q.question,
      answers: Array.isArray(q.answers) ? q.answers : [],
      correctAnswer: Array.isArray(q.answers) ? q.answers.findIndex((a: any) => a.correct === true) : 0,
      difficulty: 'medium'
    }));

    // Create game session with encrypted answers
    const sessionId = crypto.randomUUID();
    const sessionData = {
      user_id: user.id,
      session_id: sessionId,
      category: 'mixed', // Always use "mixed" category
      questions: selectedQuestions.map(q => ({
        id: q.id, // Include question ID
        question: q.question,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty
      })),
      current_question: 0,
      correct_answers: 0,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
    };

    // Store session in database
    const { error: insertError } = await supabaseClient
      .from('game_sessions')
      .insert(sessionData);

    if (insertError) {
      console.error('Error creating session:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create game session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return questions with Answer objects - use DB structure directly
    const clientQuestions = selectedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      answers: Array.isArray(q.answers) ? q.answers.map((ans: any) => ({
        key: ans.key || 'A',
        text: ans.text || '',
        correct: false // Never send correct flag to client
      })) : [],
      topic: 'mixed'
      // correctAnswer intentionally omitted
    }));

    return new Response(
      JSON.stringify({ 
        sessionId,
        questions: clientQuestions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[INTERNAL] Error in start-game-session:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});