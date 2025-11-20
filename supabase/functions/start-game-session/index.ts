import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitExceeded, RATE_LIMITS } from '../_shared/rateLimit.ts';

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Nincs bejelentkezve' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extract JWT token from Bearer header
    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        }
      }
    );

    // Use the JWT token directly with auth.getUser()
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Rate limiting check
    const rateLimitResult = await checkRateLimit(supabaseClient, 'start-game-session', RATE_LIMITS.GAME);
    if (!rateLimitResult.allowed) {
      return rateLimitExceeded(corsHeaders);
    }

    // Fetch questions from all 27 topics to ensure mixed gameplay
    // Request 4 random questions per topic = 108 questions total
    const { data: allQuestions, error: questionsError } = await supabaseClient
      .from('questions')
      .select('id, question, answers, audience, third, source_category')
      .limit(108);

    if (questionsError || !allQuestions || allQuestions.length < 15) {
      console.error('[start-game-session] Questions fetch error:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to load questions from database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group questions by topic/category to ensure diversity
    const questionsByTopic = new Map<string, any[]>();
    allQuestions.forEach(q => {
      const topic = q.source_category || 'unknown';
      if (!questionsByTopic.has(topic)) {
        questionsByTopic.set(topic, []);
      }
      questionsByTopic.get(topic)!.push(q);
    });

    // Select questions ensuring mix from different topics
    const selectedQuestions: any[] = [];
    const topics = Array.from(questionsByTopic.keys());
    
    // Round-robin selection from different topics to ensure diversity
    let topicIndex = 0;
    while (selectedQuestions.length < 15 && topics.length > 0) {
      const currentTopic = topics[topicIndex % topics.length];
      const topicQuestions = questionsByTopic.get(currentTopic)!;
      
      if (topicQuestions.length > 0) {
        // Pick random question from this topic
        const randomIndex = Math.floor(Math.random() * topicQuestions.length);
        selectedQuestions.push(topicQuestions[randomIndex]);
        topicQuestions.splice(randomIndex, 1);
      }
      
      // Remove topic if no more questions
      if (topicQuestions.length === 0) {
        questionsByTopic.delete(currentTopic);
        topics.splice(topics.indexOf(currentTopic), 1);
      } else {
        topicIndex++;
      }
    }

    const questions = selectedQuestions;

    // CRITICAL: Validate and format questions with proper error handling
    if (questions.length < 15) {
      console.error('[start-game-session] Insufficient questions:', questions.length);
      return new Response(
        JSON.stringify({ error: `Not enough questions in database: only ${questions.length} found, need 15` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format questions for client with proper validation
    const clientQuestions = questions.map((q: any, idx: number) => {
      // Validate answers structure
      if (!Array.isArray(q.answers) || q.answers.length !== 3) {
        console.error(`[start-game-session] Invalid answers for question ${q.id}:`, q.answers);
        throw new Error(`Question ${q.id} has invalid answers structure`);
      }

      // Format answers - treat missing 'correct' field as false
      const formattedAnswers = q.answers.map((ans: any) => {
        if (!ans.key || !ans.text) {
          console.error(`[start-game-session] Invalid answer in question ${q.id}:`, ans);
          throw new Error(`Question ${q.id} has invalid answer (missing key or text)`);
        }
        return {
          key: ans.key,
          text: ans.text,
          correct: ans.correct === true // undefined/false treated as false
        };
      });

      // Validate at least one correct answer exists
      const correctIndex = formattedAnswers.findIndex((a: any) => a.correct === true);
      if (correctIndex === -1) {
        console.error(`[start-game-session] No correct answer in question ${q.id}`);
        throw new Error(`Question ${q.id} has no correct answer`);
      }

      return {
        id: q.id,
        question: q.question,
        answers: formattedAnswers,
        topic: 'mixed',
        audience: q.audience || { A: 33, B: 33, C: 34 },
        third: q.third || 'A'
      };
    });

    // Create session data for database storage
    const sessionId = crypto.randomUUID();
    const sessionData = {
      user_id: user.id,
      session_id: sessionId,
      category: 'mixed',
      questions: clientQuestions.map(q => ({
        id: q.id,
        question: q.question,
        correctAnswer: q.answers.findIndex((a: any) => a.correct),
        difficulty: 'medium'
      })),
      current_question: 0,
      correct_answers: 0,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    // Store session in database
    const { error: insertError } = await supabaseClient
      .from('game_sessions')
      .insert(sessionData);

    if (insertError) {
      console.error('[start-game-session] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create game session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[start-game-session] Session ${sessionId} created with ${clientQuestions.length} questions for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        sessionId,
        questions: clientQuestions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});