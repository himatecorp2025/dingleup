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

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!supabaseUrl) errors.push('SUPABASE_URL is missing');
  if (!supabaseServiceKey) errors.push('SUPABASE_SERVICE_ROLE_KEY is missing');
  if (!lovableApiKey) errors.push('LOVABLE_API_KEY is missing');

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[generate-question-translations] Function invoked');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    // ========================================================================
    // CHUNKED PARAMETERS (same as auto-translate-all)
    // ========================================================================
    const body = await req.json().catch(() => ({}));
    const testMode = body.testMode ?? true;
    const maxItems = body.maxItems ?? 5;
    const offset = body.offset ?? 0;

    const limit = testMode ? maxItems : (body.limit ?? 25); // 25 questions per chunk for reliability

    console.log(`[generate-question-translations] Running in ${testMode ? 'TEST' : 'LIVE'} mode`);
    console.log(`[generate-question-translations] Processing chunk: offset=${offset}, limit=${limit}`);

    // Step 1: Count total questions
    const { count: totalCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    console.log(`[generate-question-translations] Total questions in database: ${totalCount}`);

    // Step 2: Fetch chunk of questions
    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('id, question, answers, correct_answer')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('[generate-question-translations] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          mode: testMode ? 'test' : 'live',
          phase: 'done',
          message: 'No more questions to process',
          hasMore: false,
          totalCount: totalCount || 0,
          processed: offset,
          stats: {
            totalFound: 0,
            attempted: 0,
            translated: 0,
            skippedExisting: 0,
            errors: 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[generate-question-translations] Processing ${questions.length} questions (${offset} - ${offset + questions.length})`);

    // Step 3: Fetch existing translations for this chunk
    const questionIds = questions.map(q => q.id);
    const { data: existingTranslations } = await supabase
      .from('question_translations')
      .select('question_id, lang')
      .in('question_id', questionIds)
      .in('lang', TARGET_LANGUAGES);

    const existingSet = new Set<string>();
    if (existingTranslations) {
      for (const t of existingTranslations) {
        existingSet.add(`${t.question_id}|${t.lang}`);
      }
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedExisting = 0;
    let attemptedCount = 0;
    const errorSamples: string[] = [];

    // Step 4: Ensure Hungarian source exists for all questions
    for (const question of questions) {
      if (!existingSet.has(`${question.id}|hu`)) {
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
    }

    // Step 5: Process each target language
    for (const lang of TARGET_LANGUAGES) {
      console.log(`[generate-question-translations] Starting translations to ${LANGUAGE_NAMES[lang]}`);

      // BATCH SIZE: 10 questions at a time for quality
      const BATCH_SIZE = 10;
      for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        
        // Filter: only translate missing translations
        const itemsToTranslate = batch.filter(q => !existingSet.has(`${q.id}|${lang}`));

        if (itemsToTranslate.length === 0) {
          skippedExisting += batch.length;
          console.log(`[generate-question-translations] Batch ${Math.floor(i / BATCH_SIZE) + 1}: all questions already translated for ${lang}`);
          continue;
        }

        // Create batch prompt
        const batchTexts = itemsToTranslate.map((item, idx) => {
          const answers = item.answers as any[];
          return `${idx + 1}. Question: "${item.question}"
   Answer A: "${answers[0]?.text || ''}"
   Answer B: "${answers[1]?.text || ''}"
   Answer C: "${answers[2]?.text || ''}"
   Correct: ${item.correct_answer || 'A'}`;
        }).join('\n\n');

        const systemPrompt = `You are a professional translator specializing in quiz questions and educational content from Hungarian to ${LANGUAGE_NAMES[lang]}.

CRITICAL RULES:
1. Translate naturally and idiomatically for ${LANGUAGE_NAMES[lang]}-speaking users
2. Maintain quiz question formatting and clarity
3. Keep answer order exactly as provided (A/B/C positions unchanged)
4. The correct answer indicator remains the same letter
5. Use native-speaker fluency and appropriate educational terminology

RESPONSE FORMAT:
Return ONLY numbered translations in this format for EACH question:
1. Question: "translated question"
   A: "translated answer A"
   B: "translated answer B"
   C: "translated answer C"

2. Question: "translated question"
   A: "translated answer A"
   B: "translated answer B"
   C: "translated answer C"

NO markdown, NO explanations, ONLY the numbered format above.`;

        const userPrompt = `Translate these ${itemsToTranslate.length} Hungarian quiz questions to ${LANGUAGE_NAMES[lang]}:

${batchTexts}

Remember: Keep answer positions (A/B/C) exactly as shown. Translate naturally for ${LANGUAGE_NAMES[lang]} speakers.`;

        attemptedCount += itemsToTranslate.length;

        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.3,
              max_tokens: 4000
            })
          });

          // AI ERROR HANDLING: STOP ALL ON CRITICAL ERRORS
          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`[generate-question-translations] AI error for ${lang}:`, aiResponse.status, errorText);

            if (aiResponse.status === 402) {
              throw new Error('PAYMENT_REQUIRED: Lovable AI credits exhausted – STOP ALL TRANSLATIONS');
            }

            if (aiResponse.status === 429) {
              throw new Error('RATE_LIMIT: AI API rate limit hit – STOP ALL TRANSLATIONS');
            }

            if (aiResponse.status >= 500) {
              throw new Error(`AI_SERVER_ERROR: ${aiResponse.status} – STOP ALL TRANSLATIONS`);
            }

            errorCount += itemsToTranslate.length;
            if (errorSamples.length < 3) {
              errorSamples.push(`AI error ${aiResponse.status} for ${lang}: ${errorText.substring(0, 100)}`);
            }
            continue;
          }

          const aiData = await aiResponse.json();
          const translatedText = aiData.choices?.[0]?.message?.content?.trim() || '';
          
          if (!translatedText) {
            errorCount += itemsToTranslate.length;
            continue;
          }

          // Parse numbered format: extract question blocks
          const questionBlocks = translatedText.split(/\n\n+/);
          
          for (let j = 0; j < itemsToTranslate.length; j++) {
            const question = itemsToTranslate[j];
            
            // Find matching block (numbered with j+1)
            const blockPattern = new RegExp(`^${j + 1}\\.\\s*Question:`, 'i');
            const matchingBlock = questionBlocks.find((block: string) => blockPattern.test(block.trim()));

            if (!matchingBlock) {
              console.error(`[generate-question-translations] No translation found for question ${j + 1}`);
              errorCount++;
              continue;
            }

            // Extract question and answers
            const questionMatch = matchingBlock.match(/Question:\s*["']?([^"\n]+)["']?/i);
            const answerAMatch = matchingBlock.match(/A:\s*["']?([^"\n]+)["']?/i);
            const answerBMatch = matchingBlock.match(/B:\s*["']?([^"\n]+)["']?/i);
            const answerCMatch = matchingBlock.match(/C:\s*["']?([^"\n]+)["']?/i);

            if (!questionMatch || !answerAMatch || !answerBMatch || !answerCMatch) {
              console.error(`[generate-question-translations] Incomplete translation for question ${j + 1}`);
              errorCount++;
              continue;
            }

            const translatedQuestion = questionMatch[1].trim();
            const translatedA = answerAMatch[1].trim();
            const translatedB = answerBMatch[1].trim();
            const translatedC = answerCMatch[1].trim();

            // Insert translation
            const { error: insertError } = await supabase
              .from('question_translations')
              .insert({
                question_id: question.id,
                lang,
                question_text: translatedQuestion,
                answer_a: translatedA,
                answer_b: translatedB,
                answer_c: translatedC,
              });

            if (insertError) {
              // Check if duplicate (23505 = unique violation)
              if (insertError.code === '23505') {
                skippedExisting++;
              } else {
                console.error(`[generate-question-translations] Insert error for ${question.id} (${lang}):`, insertError);
                errorCount++;
                if (errorSamples.length < 3) {
                  errorSamples.push(`Insert error for ${question.id} (${lang}): ${insertError.message}`);
                }
              }
            } else {
              successCount++;
              console.log(`[generate-question-translations] ✓ Question ${question.id} translated to ${lang}`);
            }
          }

          console.log(`[generate-question-translations] Completed batch ${Math.floor(i / BATCH_SIZE) + 1} for ${lang}`);

        } catch (translateError) {
          console.error(`[generate-question-translations] Translation error for ${lang}:`, translateError);
          errorCount += itemsToTranslate.length;
          if (errorSamples.length < 3) {
            errorSamples.push(`Translation error for ${lang}: ${translateError instanceof Error ? translateError.message : 'Unknown'}`);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`[generate-question-translations] Completed ${LANGUAGE_NAMES[lang]}`);
    }

    console.log(`[generate-question-translations] Chunk complete - ${successCount} success, ${errorCount} errors, ${skippedExisting} skipped existing`);

    const hasMore = (offset + questions.length) < (totalCount || 0);

    // ========================================================================
    // RETURN REPORT
    // ========================================================================
    return new Response(
      JSON.stringify({ 
        success: true,
        mode: testMode ? 'test' : 'live',
        phase: 'done',
        message: hasMore ? 'Chunk completed, more questions remaining' : 'All questions completed',
        stats: {
          totalFound: questions.length,
          attempted: attemptedCount,
          translated: successCount,
          skippedExisting: skippedExisting,
          errors: errorCount,
          languages: TARGET_LANGUAGES
        },
        sampleQuestions: questions.slice(0, 3).map(q => ({ id: q.id, question: q.question.substring(0, 50) + '...' })),
        errorSamples: errorSamples.length > 0 ? errorSamples : undefined,
        hasMore,
        nextOffset: offset + questions.length,
        totalCount: totalCount || 0,
        progress: Math.round(((offset + questions.length) / (totalCount || 1)) * 100)
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