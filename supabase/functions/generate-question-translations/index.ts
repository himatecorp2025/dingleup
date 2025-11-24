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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[generate-question-translations] Starting Hungarian to target languages translation');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // STEP 1: GET ALL HUNGARIAN SOURCE TRANSLATIONS
    // ========================================================================
    console.log('[generate-question-translations] Fetching Hungarian source translations...');
    
    const { data: hungarianSources, error: hunError } = await supabase
      .from('question_translations')
      .select('question_id, question_text, answer_a, answer_b, answer_c')
      .eq('lang', 'hu');

    if (hunError || !hungarianSources) {
      console.error('[generate-question-translations] Error fetching Hungarian sources:', hunError);
      throw new Error('Failed to fetch Hungarian sources');
    }

    console.log(`[generate-question-translations] Found ${hungarianSources.length} Hungarian sources`);

    // ========================================================================
    // STEP 2: CHECK EXISTING TARGET LANGUAGE TRANSLATIONS
    // ========================================================================
    console.log('[generate-question-translations] Checking existing translations...');
    
    const { data: existingTranslations } = await supabase
      .from('question_translations')
      .select('question_id, lang')
      .in('lang', TARGET_LANGUAGES);

    const existingMap = new Set<string>();
    if (existingTranslations) {
      for (const t of existingTranslations) {
        existingMap.add(`${t.question_id}|${t.lang}`);
      }
    }

    // ========================================================================
    // STEP 3: IDENTIFY MISSING TRANSLATIONS
    // ========================================================================
    const missingByLanguage: Record<string, Array<{question_id: string, hu_text: string, hu_a: string, hu_b: string, hu_c: string}>> = {};
    for (const lang of TARGET_LANGUAGES) {
      missingByLanguage[lang] = [];
    }

    for (const huSource of hungarianSources) {
      for (const lang of TARGET_LANGUAGES) {
        const key = `${huSource.question_id}|${lang}`;
        if (!existingMap.has(key)) {
          missingByLanguage[lang].push({
            question_id: huSource.question_id,
            hu_text: huSource.question_text,
            hu_a: huSource.answer_a,
            hu_b: huSource.answer_b,
            hu_c: huSource.answer_c
          });
        }
      }
    }

    const totalMissing = Object.values(missingByLanguage).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`[generate-question-translations] Total missing translations: ${totalMissing}`);
    for (const lang of TARGET_LANGUAGES) {
      console.log(`  - ${LANGUAGE_NAMES[lang]}: ${missingByLanguage[lang].length} missing`);
    }

    if (totalMissing === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Minden fordítás teljes - nincs hiányzó fordítás!',
          stats: { totalMissing: 0, translated: 0, errors: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ========================================================================
    // STEP 4: TRANSLATE FROM HUNGARIAN TO TARGET LANGUAGES
    // ========================================================================
    let successCount = 0;
    let errorCount = 0;
    const errorSamples: string[] = [];

    for (const lang of TARGET_LANGUAGES) {
      const missingItems = missingByLanguage[lang];
      
      if (missingItems.length === 0) {
        console.log(`[generate-question-translations] ${LANGUAGE_NAMES[lang]}: no missing translations`);
        continue;
      }

      console.log(`[generate-question-translations] Translating to ${LANGUAGE_NAMES[lang]} (${missingItems.length} questions)`);

      const BATCH_SIZE = 10;
      for (let i = 0; i < missingItems.length; i += BATCH_SIZE) {
        const batch = missingItems.slice(i, i + BATCH_SIZE);

        const batchTexts = batch.map((item, idx) => {
          return `${idx + 1}. Question: "${item.hu_text}"
   Answer A: "${item.hu_a}"
   Answer B: "${item.hu_b}"
   Answer C: "${item.hu_c}"`;
        }).join('\n\n');

        const systemPrompt = `You are a professional translator from Hungarian to ${LANGUAGE_NAMES[lang]}.

CRITICAL RULES:
1. Translate naturally and idiomatically for ${LANGUAGE_NAMES[lang]}-speaking users
2. Maintain quiz question formatting and clarity
3. Keep answer order exactly as provided (A/B/C positions unchanged)
4. Use native-speaker fluency

RESPONSE FORMAT (return ONLY this format):
1. Question: "translated question"
   A: "translated answer A"
   B: "translated answer B"
   C: "translated answer C"

NO markdown, NO explanations, ONLY the numbered format.`;

        const userPrompt = `Translate these ${batch.length} Hungarian quiz questions to ${LANGUAGE_NAMES[lang]}:

${batchTexts}`;

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

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`[generate-question-translations] AI error for ${lang}:`, aiResponse.status, errorText);

            if (aiResponse.status === 402) {
              throw new Error('PAYMENT_REQUIRED: Lovable AI credits exhausted');
            }
            if (aiResponse.status === 429) {
              throw new Error('RATE_LIMIT: AI API rate limit hit');
            }

            errorCount += batch.length;
            if (errorSamples.length < 3) {
              errorSamples.push(`AI error ${aiResponse.status} for ${lang}`);
            }
            continue;
          }

          const aiData = await aiResponse.json();
          const translatedText = aiData.choices?.[0]?.message?.content?.trim() || '';
          
          if (!translatedText) {
            errorCount += batch.length;
            continue;
          }

          const questionBlocks = translatedText.split(/\n\n+/);
          
          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            
            const blockPattern = new RegExp(`^${j + 1}\\.\\s*Question:`, 'i');
            const matchingBlock = questionBlocks.find((block: string) => blockPattern.test(block.trim()));

            if (!matchingBlock) {
              console.error(`[generate-question-translations] No translation found for question ${j + 1}`);
              errorCount++;
              continue;
            }

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

            const { error: insertError } = await supabase
              .from('question_translations')
              .insert({
                question_id: item.question_id,
                lang,
                question_text: translatedQuestion,
                answer_a: translatedA,
                answer_b: translatedB,
                answer_c: translatedC,
              });

            if (insertError) {
              console.error(`[generate-question-translations] Insert error for ${item.question_id} (${lang}):`, insertError);
              errorCount++;
              if (errorSamples.length < 3) {
                errorSamples.push(`Insert error: ${insertError.message}`);
              }
            } else {
              successCount++;
            }
          }

          console.log(`[generate-question-translations] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(missingItems.length / BATCH_SIZE)} for ${lang} complete`);

        } catch (translateError) {
          console.error(`[generate-question-translations] Translation error for ${lang}:`, translateError);
          errorCount += batch.length;
          if (errorSamples.length < 3) {
            errorSamples.push(`Error: ${translateError instanceof Error ? translateError.message : 'Unknown'}`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`[generate-question-translations] Completed ${LANGUAGE_NAMES[lang]}`);
    }

    console.log(`[generate-question-translations] Translation complete - ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${totalMissing} fordítás kezelve: ${successCount} sikeres, ${errorCount} hiba`,
        stats: {
          totalMissing,
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
