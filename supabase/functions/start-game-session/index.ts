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

// ============================================
// CRITICAL OPTIMIZATION #3: In-Memory Question Cache
// ============================================
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

// Cache TTL: 15 minutes (questions don't change frequently)
const CACHE_TTL_MS = 15 * 60 * 1000;

// Global cache maps (persist across warm function invocations)
const questionsCache = new Map<string, CacheEntry<any[]>>();
const translationsCache = new Map<string, CacheEntry<any[]>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(key); // Expired
    return null;
  }
  
  return entry.data;
}

function setCached<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, {
    data,
    cachedAt: Date.now(),
  });
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

    // Get user's preferred language
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('preferred_language')
      .eq('id', user.id)
      .single();

    const userLang = profile?.preferred_language || 'en';
    console.log(`[start-game-session] User ${user.id} language: ${userLang}`);

    // CRITICAL OPTIMIZATION: Check question cache first
    const cacheKey = 'questions:base'; // Base questions are language-independent
    let baseQuestions = getCached(questionsCache, cacheKey);
    
    if (!baseQuestions) {
      console.log('[start-game-session] CACHE MISS - Fetching questions from DB');
      // Get random question IDs (need more than 15 to account for missing translations)
      const { data: fetchedQuestions, error: questionsError } = await supabaseClient
        .from('questions')
        .select('id, correct_answer, audience, third, source_category')
        .limit(50); // Fetch 50 to have buffer for translations

      if (questionsError || !fetchedQuestions || fetchedQuestions.length === 0) {
        console.error('[start-game-session] Questions fetch error:', questionsError);
        return new Response(
          JSON.stringify({ error: 'Failed to load questions from database' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      baseQuestions = fetchedQuestions;
      setCached(questionsCache, cacheKey, baseQuestions);
      console.log('[start-game-session] Cached', baseQuestions.length, 'base questions');
    } else {
      console.log('[start-game-session] CACHE HIT - Using cached questions');
    }

    // Shuffle and get question IDs
    const shuffled = baseQuestions.sort(() => Math.random() - 0.5);
    const questionIds = shuffled.slice(0, 30).map(q => q.id);

    // OPTIMIZATION: Check translation cache
    const translationCacheKey = `translations:${userLang}:${questionIds.slice(0, 5).join(',')}`;
    let translationsPreferred = getCached(translationsCache, `${userLang}:preferred`);
    let translationsEn = getCached(translationsCache, 'en:fallback');
    let translationsHu = getCached(translationsCache, 'hu:fallback');

    // Fetch translations with fallback chain: userLang -> en -> hu
    if (!translationsPreferred) {
      const { data } = await supabaseClient
        .from('question_translations')
        .select('question_id, lang, question_text, answer_a, answer_b, answer_c')
        .in('question_id', questionIds)
        .eq('lang', userLang);
      translationsPreferred = data || [];
      // Don't cache translations too aggressively (game-specific)
    }

    if (!translationsEn) {
      const { data } = await supabaseClient
        .from('question_translations')
        .select('question_id, lang, question_text, answer_a, answer_b, answer_c')
        .in('question_id', questionIds)
        .eq('lang', 'en');
      translationsEn = data || [];
    }

    if (!translationsHu) {
      const { data } = await supabaseClient
        .from('question_translations')
        .select('question_id, lang, question_text, answer_a, answer_b, answer_c')
        .in('question_id', questionIds)
        .eq('lang', 'hu');
      translationsHu = data || [];
    }

    // Build translation map with fallback
    const translationMap = new Map();
    
    // Priority 3: hu (fallback)
    translationsHu?.forEach(t => translationMap.set(t.question_id, t));
    // Priority 2: en (fallback)
    translationsEn?.forEach(t => translationMap.set(t.question_id, t));
    // Priority 1: user's preferred language
    translationsPreferred?.forEach(t => translationMap.set(t.question_id, t));

    // Build final questions list with translations
    const questions = [];
    for (const baseQ of shuffled) {
      const translation = translationMap.get(baseQ.id);
      if (!translation) {
        console.warn(`[start-game-session] No translation for question ${baseQ.id}, skipping`);
        continue;
      }

      questions.push({
        id: baseQ.id,
        question: translation.question_text,
        answers: [
          { key: 'A', text: translation.answer_a, correct: baseQ.correct_answer === 'A' },
          { key: 'B', text: translation.answer_b, correct: baseQ.correct_answer === 'B' },
          { key: 'C', text: translation.answer_c, correct: baseQ.correct_answer === 'C' },
        ],
        audience: baseQ.audience || { A: 33, B: 33, C: 34 },
        third: baseQ.third || 'A',
        topic: baseQ.source_category || 'mixed'
      });

      // Stop when we have 15 questions
      if (questions.length >= 15) break;
    }

    if (questions.length < 15) {
      console.error('[start-game-session] Insufficient translated questions:', questions.length);
      return new Response(
        JSON.stringify({ error: `Not enough translated questions: only ${questions.length} found, need 15` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Questions are already properly formatted
    const clientQuestions = questions.slice(0, 15);

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