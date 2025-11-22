import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LangCode = 'hu' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl';

const LANGUAGE_NAMES: Record<LangCode, string> = {
  hu: 'Hungarian',
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch'
};

const TARGET_LANGUAGES: LangCode[] = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];

// ============================================================================
// PRE-FLIGHT CHECK
// ============================================================================
async function preflightCheckQuestions(supabase: SupabaseClient): Promise<string[]> {
  const errors: string[] = [];

  // 1) Kötelező env változók
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!supabaseUrl) errors.push('SUPABASE_URL is missing');
  if (!supabaseServiceKey) errors.push('SUPABASE_SERVICE_ROLE_KEY is missing');
  if (!lovableApiKey) errors.push('LOVABLE_API_KEY is missing');

  // 2) Tábla létezés és alap séma ellenőrzés
  const { error: questionsError } = await supabase
    .from('questions')
    .select('id, question, answers, correct_answer')
    .limit(1);

  if (questionsError) {
    errors.push(`questions table not accessible: ${questionsError.message}`);
  }

  const { error: qTransError } = await supabase
    .from('question_translations')
    .select('question_id, lang, question_text, answer_a, answer_b, answer_c')
    .limit(1);

  if (qTransError) {
    errors.push(`question_translations table not accessible: ${qTransError.message}`);
  }

  return errors;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateWithRetry(
  lovableApiKey: string,
  questionId: string,
  questionText: string,
  answers: any[],
  correctAnswer: string,
  lang: LangCode,
  maxRetries: number
): Promise<{ question: string; a: string; b: string; c: string } | null> {
  const systemPrompt = `You are a professional translator specializing in quiz questions and educational content.
Your task is to translate Hungarian quiz questions into ${LANGUAGE_NAMES[lang]} while maintaining:
1. Natural, native-speaker fluency
2. Appropriate educational/quiz terminology
3. Same answer order (A/B/C positions must not change)
4. The correct answer indicator remains the same letter
5. Cultural appropriateness for ${LANGUAGE_NAMES[lang]}-speaking audiences

CRITICAL: Return ONLY a valid JSON object with this exact structure:
{
  "question": "translated question text",
  "a": "translated answer A",
  "b": "translated answer B",
  "c": "translated answer C"
}

Do NOT add explanations, notes, or markdown formatting. ONLY the JSON object.`;

  const answerA = answers[0]?.text || '';
  const answerB = answers[1]?.text || '';
  const answerC = answers[2]?.text || '';

  const userPrompt = `Translate this Hungarian quiz question to ${LANGUAGE_NAMES[lang]}:

Question: ${questionText}
Answer A: ${answerA}
Answer B: ${answerB}
Answer C: ${answerC}
Correct answer: ${correctAnswer}

Remember: Keep the same answer positions (A/B/C). The correct answer is marked as "${correctAnswer}" and must remain in that position after translation.`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      // ================================================================
      // AI-HIBÁNÁL ÁLLJON LE
      // ================================================================
      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`[translate-retry] AI error for ${lang} (attempt ${attempt + 1}/${maxRetries}):`, aiResponse.status, errorText);
        
        if (aiResponse.status === 402) {
          throw new Error('PAYMENT_REQUIRED: Lovable AI credits exhausted');
        }
        
        if (aiResponse.status === 429) {
          if (attempt < maxRetries - 1) {
            console.log(`[translate-retry] Rate limit hit, retrying after delay...`);
            await delay(3000);
            continue;
          }
          throw new Error('RATE_LIMIT: AI API rate limit hit after retries');
        }

        if (aiResponse.status >= 500) {
          throw new Error(`AI_SERVER_ERROR: ${aiResponse.status}`);
        }

        return null;
      }

      const aiData = await aiResponse.json();
      const translatedText = aiData.choices?.[0]?.message?.content?.trim() || '';
      
      if (!translatedText) {
        return null;
      }

      // ================================================================
      // JSON PARSE – BIZTONSÁGOSABB KINYERÉS
      // ================================================================
      const jsonMatch = translatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[translate-retry] No JSON object found in AI response:', translatedText);
        return null;
      }

      const cleanText = jsonMatch[0];

      let translated;
      try {
        translated = JSON.parse(cleanText);
      } catch (e) {
        console.error('[translate-retry] JSON parse error:', e, 'raw:', cleanText);
        return null;
      }

      // Validate structure
      if (!translated.question || !translated.a || !translated.b || !translated.c) {
        return null;
      }

      return translated;

    } catch (error) {
      console.error(`[translate-retry] Error on attempt ${attempt + 1}/${maxRetries}:`, error);
      
      // Ha payment required vagy rate limit, ne próbálkozz tovább
      if (error instanceof Error && (error.message.includes('PAYMENT_REQUIRED') || error.message.includes('RATE_LIMIT') || error.message.includes('AI_SERVER_ERROR'))) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        await delay(3000);
      }
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role client WITHOUT user auth header to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // PRE-FLIGHT CHECK
    // ========================================================================
    const preflightErrors = await preflightCheckQuestions(supabase);
    if (preflightErrors.length > 0) {
      console.error('[generate-question-translations] Preflight check failed:', preflightErrors);
      return new Response(JSON.stringify({
        success: false,
        phase: 'preflight',
        errors: preflightErrors,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create broadcast channel for real-time progress updates
    const progressChannel = supabase.channel('question-translation-progress');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    // ========================================================================
    // SAFE / TEST MODE SUPPORT
    // ========================================================================
    const body = await req.json().catch(() => ({}));
    const testMode = body.testMode ?? true; // ALAPÉRTELMEZÉS: TEST MODE = TRUE
    const maxItems = body.maxItems ?? 5; // ALAPÉRTELMEZÉS: 5 kérdés

    const MAX_QUESTIONS_PER_RUN = testMode ? maxItems : 100;
    const BATCH_SIZE = testMode ? 3 : 15;
    const DELAY_BETWEEN_BATCHES = 300;
    const MAX_RETRIES = 3;

    console.log(`[generate-question-translations] Running in ${testMode ? 'TEST' : 'LIVE'} mode`);
    console.log(`[generate-question-translations] Max questions: ${MAX_QUESTIONS_PER_RUN}, Batch size: ${BATCH_SIZE}`);

    // Fetch questions using pagination (1000-row Lovable Cloud backend limit)
    const allQuestions: Array<{ id: string; question: string; answers: any; correct_answer: string | null }> = [];
    const PAGE_SIZE = 500;
    let page = 0;
    let hasMore = true;

    while (hasMore && allQuestions.length < MAX_QUESTIONS_PER_RUN * 2) {
      const { data: batch, error: batchError } = await supabase
        .from('questions')
        .select('id, question, answers, correct_answer')
        .order('created_at', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (batchError) throw batchError;

      if (batch && batch.length > 0) {
        allQuestions.push(...batch);
        console.log(`[generate-question-translations] Fetched page ${page + 1}: ${batch.length} questions (total: ${allQuestions.length})`);
        page++;
        hasMore = batch.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    // OPTIMIZED: Batch-fetch all existing translations at once
    const questionIds = allQuestions.map(q => q.id);
    const { data: existingTranslations } = await supabase
      .from('question_translations')
      .select('question_id, lang')
      .in('question_id', questionIds)
      .in('lang', TARGET_LANGUAGES);

    // Create a Set for fast lookup: "questionId|lang"
    const existingSet = new Set<string>();
    if (existingTranslations) {
      for (const t of existingTranslations) {
        existingSet.add(`${t.question_id}|${t.lang}`);
      }
    }

    // ========================================================================
    // NE ÍRJA FELÜL A MEGLÉVŐ FORDÍTÁSOKAT
    // ========================================================================
    const questionsNeedingTranslation: typeof allQuestions = [];
    for (const q of allQuestions) {
      let needsTranslation = false;
      for (const lang of TARGET_LANGUAGES) {
        if (!existingSet.has(`${q.id}|${lang}`)) {
          needsTranslation = true;
          break;
        }
      }
      if (needsTranslation) {
        questionsNeedingTranslation.push(q);
      }
      if (questionsNeedingTranslation.length >= MAX_QUESTIONS_PER_RUN) {
        break;
      }
    }

    const questions = questionsNeedingTranslation;

    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        mode: testMode ? 'test' : 'live',
        phase: 'done',
        message: 'No questions to translate',
        stats: {
          totalQuestions: 0,
          totalTranslationsAttempted: 0,
          translatedCount: 0,
          skippedCount: 0,
          errors: 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[generate-question-translations] Found ${questions.length} questions needing translation`);

    let translatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    const totalQuestions = questions.length;
    const totalOperations = totalQuestions * TARGET_LANGUAGES.length;

    // Broadcast initial progress
    await progressChannel.send({
      type: 'broadcast',
      event: 'progress',
      payload: {
        progress: 0,
        status: 'Fordítás indítása...',
        translated: 0,
        skipped: 0,
        errors: 0,
        total: totalQuestions
      }
    });

    // Process questions in batches
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
      
      console.log(`[generate-question-translations] Processing batch ${batchNumber}/${totalBatches}`);

      const currentProgress = Math.floor((i / totalQuestions) * 100);
      await progressChannel.send({
        type: 'broadcast',
        event: 'progress',
        payload: {
          progress: currentProgress,
          status: `Batch ${batchNumber}/${totalBatches} feldolgozása...`,
          translated: translatedCount,
          skipped: skippedCount,
          errors: errors.length,
          total: totalQuestions
        }
      });

      for (const question of batch) {
        // First, ensure Hungarian source exists
        const { data: huExists } = await supabase
          .from('question_translations')
          .select('id')
          .eq('question_id', question.id)
          .eq('lang', 'hu')
          .single();

        if (!huExists) {
          const answers = question.answers as any[];
          
          await supabase
            .from('question_translations')
            .insert({
              question_id: question.id,
              lang: 'hu',
              question_text: question.question,
              answer_a: answers[0]?.text || '',
              answer_b: answers[1]?.text || '',
              answer_c: answers[2]?.text || '',
            });
        }

        // Translate to each target language
        for (const lang of TARGET_LANGUAGES) {
          try {
            // Check existence using pre-fetched Set
            if (existingSet.has(`${question.id}|${lang}`)) {
              skippedCount++;
              continue;
            }

            const answers = question.answers as any[];

            // Translate with retry logic
            let translated;
            try {
              translated = await translateWithRetry(
                LOVABLE_API_KEY,
                question.id,
                question.question,
                answers,
                question.correct_answer || 'A',
                lang,
                MAX_RETRIES
              );
            } catch (error) {
              // If payment required or critical error, stop entire process
              if (error instanceof Error && (error.message.includes('PAYMENT_REQUIRED') || error.message.includes('RATE_LIMIT') || error.message.includes('AI_SERVER_ERROR'))) {
                console.error('[generate-question-translations] CRITICAL ERROR:', error.message);
                throw error;
              }
              throw error;
            }

            if (!translated) {
              errors.push(`Translation failed for question ${question.id} (${lang}) after ${MAX_RETRIES} retries`);
              if (errors.length >= 3) {
                // Stop after 3 errors
                throw new Error('Too many translation errors - stopping');
              }
              continue;
            }

            // Insert translation
            const { error: insertError } = await supabase
              .from('question_translations')
              .insert({
                question_id: question.id,
                lang,
                question_text: translated.question,
                answer_a: translated.a,
                answer_b: translated.b,
                answer_c: translated.c,
              });

            if (insertError) {
              console.error(`[generate-question-translations] Insert error for ${question.id} (${lang}):`, JSON.stringify(insertError, null, 2));
              errors.push(`Insert failed for question ${question.id} (${lang}): ${insertError.message || insertError.code || 'Unknown error'}`);
            } else {
              translatedCount++;
              console.log(`[generate-question-translations] ✓ Question ${question.id} translated to ${lang}`);
              
              const processedSoFar = i + batch.indexOf(question) + 1;
              const currentProgress = Math.floor((processedSoFar / totalQuestions) * 100);
              await progressChannel.send({
                type: 'broadcast',
                event: 'progress',
                payload: {
                  progress: Math.min(currentProgress, 99),
                  status: `${processedSoFar}/${totalQuestions} kérdés feldolgozva...`,
                  translated: translatedCount,
                  skipped: skippedCount,
                  errors: errors.length,
                  total: totalQuestions
                }
              });
            }

          } catch (error) {
            console.error(`[generate-question-translations] Error translating question ${question.id} to ${lang}:`, error);
            errors.push(`Error for question ${question.id} (${lang}): ${error instanceof Error ? error.message : 'Unknown'}`);
          }
        }
      }

      if (i + BATCH_SIZE < questions.length) {
        console.log(`[generate-question-translations] Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log(`[generate-question-translations] Complete! Translated: ${translatedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`);

    await progressChannel.send({
      type: 'broadcast',
      event: 'progress',
      payload: {
        progress: 100,
        status: 'Fordítás befejezve!',
        translated: translatedCount,
        skipped: skippedCount,
        errors: errors.length,
        total: totalQuestions
      }
    });

    await supabase.removeChannel(progressChannel);

    // ========================================================================
    // VISSZATÉRŐ RIPORT
    // ========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        mode: testMode ? 'test' : 'live',
        phase: 'done',
        stats: {
          totalQuestions: totalQuestions,
          totalTranslationsAttempted: translatedCount + skippedCount,
          translatedCount: translatedCount,
          skippedCount: skippedCount,
          errors: errors.length
        },
        errorSamples: errors.length > 0 ? errors.slice(0, 3) : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[generate-question-translations] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        phase: 'translate',
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
