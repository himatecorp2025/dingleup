import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

// Game session data structures
interface GameSession {
  userId: string;
  sessionId: string;
  category: string;
  questions: QuestionData[];
  startTime: number;
  answers: AnswerSubmission[];
}

interface QuestionData {
  id: string;
  question: string;
  correctAnswer: string;
}

interface AnswerSubmission {
  questionId: string;
  answer: string;
  responseTime: number;
  isCorrect: boolean;
}

// Store active sessions (in production, use Redis/Upstash)
const activeSessions = new Map<string, GameSession>();

// Hardcoded question bank for validation (in production, use database)
const QUESTION_BANKS: Record<string, QuestionData[]> = {
  general: [
    { id: "q1", question: "Mi Magyarország fővárosa?", correctAnswer: "Budapest" },
    { id: "q2", question: "Hány kontinens van a Földön?", correctAnswer: "7" },
    { id: "q3", question: "Ki festette a Mona Lisát?", correctAnswer: "Leonardo da Vinci" },
  ],
};

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
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const body = await req.json();
    const { action } = body;

    // Validate action input
    const validActions = ['start', 'submit_answer', 'complete'];
    if (!action || typeof action !== 'string' || !validActions.includes(action)) {
      throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    // Handle game start
    if (action === 'start') {
      const { category = 'general' } = body;
      
      // Validate category
      if (typeof category !== 'string' || !QUESTION_BANKS[category]) {
        throw new Error(`Invalid category. Available: ${Object.keys(QUESTION_BANKS).join(', ')}`);
      }

      const sessionId = crypto.randomUUID();
      const questions = QUESTION_BANKS[category];

      const session: GameSession = {
        userId: user.id,
        sessionId,
        category,
        questions,
        startTime: Date.now(),
        answers: [],
      };

      activeSessions.set(sessionId, session);

      // Return questions without correct answers
      return new Response(
        JSON.stringify({
          success: true,
          sessionId,
          questions: questions.map(q => ({ id: q.id, question: q.question })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle answer submission
    if (action === 'submit_answer') {
      const { sessionId, questionId, answer, responseTime } = body;

      // Validate all required inputs
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Valid session ID is required');
      }
      if (!questionId || typeof questionId !== 'string') {
        throw new Error('Valid question ID is required');
      }
      if (answer === undefined || answer === null || typeof answer !== 'string') {
        throw new Error('Answer is required');
      }
      if (typeof responseTime !== 'number' || responseTime < 1 || responseTime > 120000) {
        throw new Error('Invalid response time (1-120000ms)');
      }

      const session = activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found or expired');
      }

      if (session.userId !== user.id) {
        throw new Error('Unauthorized: Session belongs to different user');
      }

      // Find correct answer
      const question = session.questions.find(q => q.id === questionId);
      if (!question) {
        throw new Error('Question not found in session');
      }

      // SERVER-SIDE VALIDATION: Compare with stored correct answer
      const normalizedAnswer = answer.trim().toLowerCase();
      const normalizedCorrect = question.correctAnswer.trim().toLowerCase();
      const isCorrect = normalizedAnswer === normalizedCorrect;

      session.answers.push({ questionId, answer, responseTime, isCorrect });
      console.log('Answer validated:', { sessionId, questionId, isCorrect });

      return new Response(
        JSON.stringify({ success: true, isCorrect }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle game completion
    if (action === 'complete') {
      const { sessionId } = body;

      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Valid session ID is required');
      }

      const session = activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found or expired');
      }

      if (session.userId !== user.id) {
        throw new Error('Unauthorized: Session belongs to different user');
      }

      // Calculate results
      const correctAnswers = session.answers.filter(a => a.isCorrect).length;
      const totalQuestions = session.questions.length;
      const totalTime = Date.now() - session.startTime;
      const coinsEarned = 10 + (correctAnswers * 5) + (totalTime < 30000 ? 10 : 0);

      // Store results with service role
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      await supabaseService.from('game_results').insert({
        user_id: user.id,
        category: session.category,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        total_time: totalTime,
        coins_earned: coinsEarned,
      });

      await supabaseService.rpc('award_coins', { amount: coinsEarned });

      // Clean up
      activeSessions.delete(sessionId);
      console.log('Game completed:', { sessionId, correctAnswers, coinsEarned });

      return new Response(
        JSON.stringify({ success: true, correctAnswers, totalQuestions, totalTime, coinsEarned }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in validate-game-session:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});