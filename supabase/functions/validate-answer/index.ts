import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

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

    const { sessionId, questionIndex, selectedAnswer, responseTime } = await req.json();

    // Validate inputs
    if (!sessionId || typeof questionIndex !== 'number' || typeof selectedAnswer !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get game session
    const { data: session, error: sessionError } = await supabaseClient
      .from('game_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check session expiry
    if (new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate question index
    if (questionIndex !== session.current_question) {
      return new Response(
        JSON.stringify({ error: 'Invalid question index' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get correct answer from stored session
    const currentQuestion = session.questions[questionIndex];
    if (!currentQuestion) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const newCorrectCount = isCorrect ? session.correct_answers + 1 : session.correct_answers;

    // Calculate reward for correct answer
    let reward = 0;
    if (isCorrect) {
      const baseReward = currentQuestion.difficulty === 'hard' ? 25 : 
                        currentQuestion.difficulty === 'medium' ? 15 : 10;
      
      // Bonus for fast answers (if responseTime provided and valid)
      if (responseTime && responseTime < 5000) {
        reward = Math.floor(baseReward * 1.5);
      } else {
        reward = baseReward;
      }
    }

    // Update session
    const { error: updateError } = await supabaseClient
      .from('game_sessions')
      .update({
        current_question: questionIndex + 1,
        correct_answers: newCorrectCount,
      })
      .eq('session_id', sessionId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        correct: isCorrect,
        reward,
        correctAnswer: currentQuestion.correctAnswer,
        totalCorrect: newCorrectCount,
        currentQuestion: questionIndex + 1,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[INTERNAL] Error in validate-answer:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});