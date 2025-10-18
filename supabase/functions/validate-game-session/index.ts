import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameSession {
  category: string;
  questions: Array<{
    id: string;
    question: string;
    correctAnswer: string;
  }>;
}

interface AnswerSubmission {
  sessionId: string;
  questionId: string;
  answer: string;
  responseTime: number;
}

interface GameCompletion {
  sessionId: string;
}

// Store active sessions in memory (in production, use Redis/Upstash)
const activeSessions = new Map<string, GameSession>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action } = await req.json();

    // START GAME - Create session with questions
    if (action === 'start') {
      const { category } = await req.json();
      
      console.log('Starting game session for user:', user.id, 'category:', category);

      // Load questions from JSON files (server-side)
      const questionFiles: Record<string, string> = {
        'general': '/questions1.json',
        'culture': '/questions-culture.json',
        'finance': '/questions-finance.json',
        'health': '/questions-health.json',
        'history': '/questions-history.json',
      };

      const fileName = questionFiles[category] || questionFiles['general'];
      
      // In a real implementation, load from secure storage
      // For now, we'll create a session without exposing correct answers
      const sessionId = crypto.randomUUID();
      
      // Generate 15 random question IDs (don't send questions to client yet)
      const questionIds = Array.from({ length: 15 }, (_, i) => `q_${i + 1}`);
      
      activeSessions.set(sessionId, {
        category,
        questions: [], // Will be populated when validating answers
      });

      console.log('Game session created:', sessionId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId,
          questionCount: 15
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SUBMIT ANSWER - Validate answer server-side
    if (action === 'submit_answer') {
      const { sessionId, questionIndex, answer, responseTime }: AnswerSubmission & { questionIndex: number } = await req.json();
      
      console.log('Validating answer for session:', sessionId, 'question:', questionIndex);

      const session = activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Invalid session');
      }

      // Validate response time (should be reasonable)
      if (responseTime < 1 || responseTime > 60000) {
        throw new Error('Invalid response time');
      }

      // In real implementation: fetch correct answer from secure storage
      // and compare with submitted answer
      const isCorrect = true; // Placeholder

      return new Response(
        JSON.stringify({ 
          success: true, 
          isCorrect,
          // Don't reveal correct answer until game ends
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // COMPLETE GAME - Calculate final score and award coins
    if (action === 'complete') {
      const { sessionId }: GameCompletion = await req.json();
      
      console.log('Completing game session:', sessionId);

      const session = activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Invalid session');
      }

      // In real implementation: calculate score from stored answers
      const correctAnswers = 10; // Placeholder
      const avgResponseTime = 5000; // Placeholder
      const coinsEarned = correctAnswers * 10;

      // Store game result
      const { error: insertError } = await supabaseClient
        .from('game_results')
        .insert({
          user_id: user.id,
          category: session.category,
          total_questions: 15,
          correct_answers: correctAnswers,
          average_response_time: avgResponseTime,
          coins_earned: coinsEarned,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting game result:', insertError);
        throw insertError;
      }

      // Award coins using secure function
      const { error: coinsError } = await supabaseClient.rpc('award_coins', {
        amount: coinsEarned,
      });

      if (coinsError) {
        console.error('Error awarding coins:', coinsError);
        throw coinsError;
      }

      // Update total correct answers
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('total_correct_answers')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabaseClient
          .from('profiles')
          .update({
            total_correct_answers: profile.total_correct_answers + correctAnswers,
          })
          .eq('id', user.id);
      }

      // Clean up session
      activeSessions.delete(sessionId);

      console.log('Game completed successfully. Coins awarded:', coinsEarned);

      return new Response(
        JSON.stringify({ 
          success: true, 
          correctAnswers,
          coinsEarned,
          avgResponseTime,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in validate-game-session:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});