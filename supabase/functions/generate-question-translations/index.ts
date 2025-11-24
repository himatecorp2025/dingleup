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
    // STEP 1: GET ALL QUESTIONS
    // ========================================================================
    console.log('[generate-question-translations] Fetching all questions...');
    
    const { data: allQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question, answers, correct_answer');

    if (questionsError || !allQuestions) {
      console.error('[generate-question-translations] Error fetching questions:', questionsError);
      throw new Error('Failed to fetch questions');
    }

    console.log(`[generate-question-translations] Found ${allQuestions.length} total questions`);

    // ========================================================================
    // STEP 2: CHECK ALL EXISTING TRANSLATIONS
    // ========================================================================
    console.log('[generate-question-translations] Checking existing translations...');
    
    const { data: existingTranslations } = await supabase
      .from('question_translations')
      .select('question_id, lang, question_text')
      .in('lang', TARGET_LANGUAGES);

    // Build a map of existing translations: "question_id|lang" -> translation
    const existingMap = new Map<string, any>();
    const truncatedItems: Array<{question_id: string, lang: string}> = [];

    if (existingTranslations) {
      for (const t of existingTranslations) {
        const key = `${t.question_id}|${t.lang}`;
        existingMap.set(key, t);
        
        // Check if truncated (< 15 characters)
        if (t.question_text && t.question_text.length < 15) {
          truncatedItems.push({ question_id: t.question_id, lang: t.lang });
        }
      }
    }

    console.log(`[generate-question-translations] Found ${truncatedItems.length} truncated translations`);

    // ========================================================================
    // STEP 3: DELETE ALL TRUNCATED TRANSLATIONS
    // ========================================================================
    if (truncatedItems.length > 0) {
      console.log(`[generate-question-translations] Deleting ${truncatedItems.length} truncated translations...`);
      
      for (const item of truncatedItems) {
        await supabase
          .from('question_translations')
          .delete()
          .eq('question_id', item.question_id)
          .eq('lang', item.lang);
        
        // Remove from existing map so they will be re-translated
        existingMap.delete(`${item.question_id}|${item.lang}`);
      }
      
      console.log(`[generate-question-translations] Deleted ${truncatedItems.length} truncated translations`);
    }

    // ========================================================================
    // STEP 4: ENSURE HUNGARIAN SOURCE EXISTS FOR ALL QUESTIONS
    // ========================================================================
    console.log('[generate-question-translations] Ensuring Hungarian sources exist...');
    
    const { data: hungarianTranslations } = await supabase
      .from('question_translations')
      .select('question_id')
      .eq('lang', 'hu');
    
    const hungarianSet = new Set<string>();
    if (hungarianTranslations) {
      for (const t of hungarianTranslations) {
        hungarianSet.add(t.question_id);
      }
    }

    let hungarianCreated = 0;
    for (const question of allQuestions) {
      if (!hungarianSet.has(question.id)) {
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
        hungarianCreated++;
      }
    }

    console.log(`[generate-question-translations] Created ${hungarianCreated} Hungarian sources`);

    // ========================================================================
    // STEP 5: IDENTIFY ALL MISSING TRANSLATIONS
    // ========================================================================
    console.log('[generate-question-translations] Identifying missing translations...');
    
    const missingByLanguage: Record<string, string[]> = {};
    for (const lang of TARGET_LANGUAGES) {
      missingByLanguage[lang] = [];
    }

    for (const question of allQuestions) {
      for (const lang of TARGET_LANGUAGES) {
        const key = `${question.id}|${lang}`;
        if (!existingMap.has(key)) {
          missingByLanguage[lang].push(question.id);
        }
      }
    }

    const totalMissing = Object.values(missingByLanguage).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`[generate-question-translations] Total missing translations: ${totalMissing}`);
    for (const lang of TARGET_LANGUAGES) {
      console.log(`  - ${LANGUAGE_NAMES[lang]}: ${missingByLanguage[lang].length} missing`);
    }

    if (totalMissing === 0 && truncatedItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          phase: 'scan',
          message: 'Minden fordítás teljes - nincs hiányzó vagy csonka fordítás!',
          stats: {
            totalQuestions: allQuestions.length,
            totalMissing: 0,
            truncatedDeleted: 0,
            translated: 0,
            errors: 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ========================================================================
    // STEP 6: TRANSLATE ALL MISSING TRANSLATIONS
    // ========================================================================
    let successCount = 0;
    let errorCount = 0;
    const errorSamples: string[] = [];

    for (const lang of TARGET_LANGUAGES) {
      const missingQuestionIds = missingByLanguage[lang];
      
      if (missingQuestionIds.length === 0) {
        console.log(`[generate-question-translations] ${LANGUAGE_NAMES[lang]}: no missing translations`);
        continue;
      }

      console.log(`[generate-question-translations] Starting translations to ${LANGUAGE_NAMES[lang]} (${missingQuestionIds.length} questions)`);

      const questionsToTranslate = allQuestions.filter(q => missingQuestionIds.includes(q.id));

      // BATCH SIZE: 10 questions at a time for quality
      const BATCH_SIZE = 10;
      for (let i = 0; i < questionsToTranslate.length; i += BATCH_SIZE) {
        const batch = questionsToTranslate.slice(i, i + BATCH_SIZE);

        // Create batch prompt
        const batchTexts = batch.map((item, idx) => {
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

        const userPrompt = `Translate these ${batch.length} Hungarian quiz questions to ${LANGUAGE_NAMES[lang]}:

${batchTexts}

Remember: Keep answer positions (A/B/C) exactly as shown. Translate naturally for ${LANGUAGE_NAMES[lang]} speakers.`;

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

            errorCount += batch.length;
            if (errorSamples.length < 3) {
              errorSamples.push(`AI error ${aiResponse.status} for ${lang}: ${errorText.substring(0, 100)}`);
            }
            continue;
          }

          const aiData = await aiResponse.json();
          const translatedText = aiData.choices?.[0]?.message?.content?.trim() || '';
          
          if (!translatedText) {
            errorCount += batch.length;
            continue;
          }

          // Parse numbered format: extract question blocks
          const questionBlocks = translatedText.split(/\n\n+/);
          
          for (let j = 0; j < batch.length; j++) {
            const question = batch[j];
            
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
              console.error(`[generate-question-translations] Insert error for ${question.id} (${lang}):`, insertError);
              errorCount++;
              if (errorSamples.length < 3) {
                errorSamples.push(`Insert error for ${question.id} (${lang}): ${insertError.message}`);
              }
            } else {
              successCount++;
              console.log(`[generate-question-translations] ✓ Question ${question.id} translated to ${lang}`);
            }
          }

          console.log(`[generate-question-translations] Completed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(questionsToTranslate.length / BATCH_SIZE)} for ${lang}`);

        } catch (translateError) {
          console.error(`[generate-question-translations] Translation error for ${lang}:`, translateError);
          errorCount += batch.length;
          if (errorSamples.length < 3) {
            errorSamples.push(`Translation error for ${lang}: ${translateError instanceof Error ? translateError.message : 'Unknown'}`);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`[generate-question-translations] Completed ${LANGUAGE_NAMES[lang]}: ${missingQuestionIds.length} attempted`);
    }

    console.log(`[generate-question-translations] Translation complete - ${successCount} success, ${errorCount} errors`);

    // ========================================================================
    // RETURN REPORT
    // ========================================================================
    return new Response(
      JSON.stringify({ 
        success: true,
        phase: 'done',
        message: `Fordítás befejezve: ${totalMissing} hiányzó + ${truncatedItems.length} csonka fordítás kezelve`,
        stats: {
          totalQuestions: allQuestions.length,
          totalMissing,
          truncatedDeleted: truncatedItems.length,
          hungarianCreated,
          translated: successCount,
          errors: errorCount,
          byLanguage: Object.fromEntries(
            TARGET_LANGUAGES.map(lang => [lang, {
              missing: missingByLanguage[lang].length,
              name: LANGUAGE_NAMES[lang]
            }])
          )
        },
        errorSamples: errorSamples.length > 0 ? errorSamples : undefined
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
        error: error instanceof Error ? error.message : 'Unknown fatal error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
