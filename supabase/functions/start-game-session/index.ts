import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitExceeded, RATE_LIMITS } from '../_shared/rateLimit.ts';

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

    // OPTIMIZATION: Enable connection pooler for better scalability
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { 
            Authorization: authHeader,
            'X-Connection-Pooler': 'true', // Connection pooling for high concurrency
          },
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

    console.log(`[start-game-session] User ${user.id} starting game`);

    // =====================================================
    // CRITICAL: USE GLOBAL POOL SYSTEM + MULTILINGUAL QUESTIONS
    // =====================================================
    
    // Get user's last pool order AND language preference
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('preferred_language')
      .eq('id', user.id)
      .single();

    const userLang = userProfile?.preferred_language || 'en';
    
    const { data: poolSession } = await supabaseClient
      .from('game_session_pools')
      .select('last_pool_order')
      .eq('user_id', user.id)
      .single();

    const lastPoolOrder = poolSession?.last_pool_order || null;
    
    console.log(`[start-game-session] User ${user.id} last pool: ${lastPoolOrder}, lang: ${userLang}`);

    // Call the get-game-questions function with user's language
    const { data: questionsData, error: questionsError } = await supabaseClient.functions.invoke(
      'get-game-questions',
      {
        body: {
          last_pool_order: lastPoolOrder,
          lang: userLang,
        },
      }
    );

    if (questionsError || !questionsData) {
      console.error('[start-game-session] Failed to get questions from pool:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to load questions from pool system' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { questions: poolQuestions, used_pool_order, fallback } = questionsData;

    if (!poolQuestions || poolQuestions.length < 15) {
      console.error('[start-game-session] Insufficient questions from pool:', poolQuestions?.length);
      return new Response(
        JSON.stringify({ error: `Not enough questions: only ${poolQuestions?.length || 0} found, need 15` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[start-game-session] Got ${poolQuestions.length} questions from pool ${used_pool_order || 'fallback'}`);

    // Update user's pool session (if not fallback)
    if (used_pool_order !== null) {
      await supabaseClient
        .from('game_session_pools')
        .upsert({
          user_id: user.id,
          last_pool_order: used_pool_order,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
      
      console.log(`[start-game-session] Updated user pool session: pool ${used_pool_order}`);
    }

    // Questions are already properly formatted from pool
    const clientQuestions = poolQuestions.slice(0, 15);

    // Create session data for database storage
    const sessionId = crypto.randomUUID();
    const sessionData = {
      user_id: user.id,
      session_id: sessionId,
      category: 'mixed',
      questions: clientQuestions.map((q: any) => ({
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

    console.log(`[start-game-session] Session ${sessionId} created with pool ${used_pool_order || 'fallback'} for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        sessionId,
        questions: clientQuestions,
        poolUsed: used_pool_order,
        fallback: fallback || false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[start-game-session] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
