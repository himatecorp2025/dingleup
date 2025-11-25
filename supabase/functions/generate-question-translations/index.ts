import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Get target language from request (optional - if not provided, process all)
        const body = await req.json().catch(() => ({}));
        const targetLang = body.targetLang as LangCode | undefined;
        
        console.log('[generate-question-translations] Starting Hungarian to target languages translation', targetLang ? `for ${targetLang}` : 'for all languages');
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        sendProgress({ type: 'start', message: 'Magyar forrásnyelv betöltése...' });

        // ========================================================================
        // STEP 1: GET ALL HUNGARIAN SOURCE TRANSLATIONS
        // ========================================================================
        const { data: hungarianSources, error: hunError } = await supabase
          .from('question_translations')
          .select('question_id, question_text, answer_a, answer_b, answer_c')
          .eq('lang', 'hu');

        if (hunError || !hungarianSources) {
          console.error('[generate-question-translations] Error fetching Hungarian sources:', hunError);
          sendProgress({ type: 'error', message: 'Hiba a magyar kérdések betöltésénél' });
          controller.close();
          return;
        }

        console.log(`[generate-question-translations] Found ${hungarianSources.length} Hungarian sources`);
        sendProgress({ 
          type: 'progress', 
          message: `${hungarianSources.length} magyar kérdés betöltve`,
          total: hungarianSources.length 
        });

        // ========================================================================
        // STEP 2: CHECK EXISTING TARGET LANGUAGE TRANSLATIONS
        // ========================================================================
        sendProgress({ type: 'progress', message: 'Meglévő fordítások ellenőrzése...' });
        
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
        
        sendProgress({ 
          type: 'progress', 
          message: `${totalMissing} hiányzó fordítás azonosítva`,
          totalMissing 
        });

        if (totalMissing === 0) {
          sendProgress({ 
            type: 'complete', 
            message: 'Minden fordítás teljes!',
            totalMissing: 0,
            totalSuccess: 0,
            totalErrors: 0
          });
          controller.close();
          return;
        }

        // ========================================================================
        // STEP 4: TRANSLATE FROM HUNGARIAN TO TARGET LANGUAGES
        // ========================================================================
        let successCount = 0;
        let errorCount = 0;
        const errorSamples: string[] = [];

        // Process only the target language if specified, otherwise all languages
        const languagesToProcess = targetLang ? [targetLang as LangCode] : TARGET_LANGUAGES;
        
        for (const lang of languagesToProcess) {
          const missingItems = missingByLanguage[lang];
          
          if (missingItems.length === 0) {
            console.log(`[generate-question-translations] ${LANGUAGE_NAMES[lang]}: no missing translations`);
            continue;
          }

          console.log(`[generate-question-translations] Translating to ${LANGUAGE_NAMES[lang]} (${missingItems.length} questions)`);
          
          sendProgress({ 
            type: 'language_start', 
            message: `${LANGUAGE_NAMES[lang]} fordítása (${missingItems.length} kérdés)`,
            lang,
            langName: LANGUAGE_NAMES[lang],
            total: missingItems.length
          });

          const BATCH_SIZE = 20;
          const totalBatches = Math.ceil(missingItems.length / BATCH_SIZE);
          
          for (let i = 0; i < missingItems.length; i += BATCH_SIZE) {
            const batch = missingItems.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;

            sendProgress({ 
              type: 'batch_start', 
              message: `${LANGUAGE_NAMES[lang]}: batch ${batchNum}/${totalBatches}`,
              lang,
              langName: LANGUAGE_NAMES[lang],
              batchNum,
              totalBatches,
              processed: i,
              total: missingItems.length
            });

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
5. Keep translations concise - questions max 75 chars, answers max 50 chars when possible

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
                  const errorMsg = 'AI kredit elfogyott - töltsd fel a Lovable workspace-t!';
                  console.error(`[generate-question-translations] ${errorMsg}`);
                  sendProgress({ type: 'error', message: errorMsg });
                  controller.close();
                  return;
                }
                if (aiResponse.status === 429) {
                  const errorMsg = `Rate limit elérve ${lang} nyelven - 10 másodperc várakozás...`;
                  console.warn(`[generate-question-translations] ${errorMsg}`);
                  sendProgress({ type: 'error', message: errorMsg });
                  await new Promise(resolve => setTimeout(resolve, 10000)); // Increased to 10s for rate limit
                  continue;
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
                console.error(`[generate-question-translations] Empty AI response for ${lang}`);
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

                // CRITICAL: Use upsert to handle duplicates gracefully
                const { error: insertError } = await supabase
                  .from('question_translations')
                  .upsert({
                    question_id: item.question_id,
                    lang,
                    question_text: translatedQuestion,
                    answer_a: translatedA,
                    answer_b: translatedB,
                    answer_c: translatedC,
                  }, {
                    onConflict: 'question_id,lang',
                    ignoreDuplicates: false
                  });

                if (insertError) {
                  console.error(`[generate-question-translations] Insert error for ${item.question_id} (${lang}):`, insertError);
                  errorCount++;
                  if (errorSamples.length < 3) {
                    errorSamples.push(`Insert error: ${insertError.message}`);
                  }
                } else {
                  successCount++;
                  console.log(`[generate-question-translations] ✓ Question ${item.question_id} translated to ${lang}`);
                }
              }

              sendProgress({ 
                type: 'batch_complete', 
                message: `${LANGUAGE_NAMES[lang]}: batch ${batchNum}/${totalBatches} kész`,
                lang,
                langName: LANGUAGE_NAMES[lang],
                batchNum,
                totalBatches,
                processed: Math.min(i + BATCH_SIZE, missingItems.length),
                total: missingItems.length
              });

              console.log(`[generate-question-translations] Completed batch ${batchNum}/${totalBatches} for ${lang}`);

            } catch (translateError) {
              console.error(`[generate-question-translations] Translation error for ${lang}:`, translateError);
              errorCount += batch.length;
              if (errorSamples.length < 3) {
                errorSamples.push(`Error: ${translateError instanceof Error ? translateError.message : 'Unknown'}`);
              }
              sendProgress({ 
                type: 'error', 
                message: `Hiba: ${translateError instanceof Error ? translateError.message : 'Ismeretlen hiba'}`
              });
            }

            // Rate limit protection: 500ms delay between batches
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          sendProgress({ 
            type: 'language_complete', 
            message: `${LANGUAGE_NAMES[lang]} kész`,
            lang
          });

          console.log(`[generate-question-translations] Completed ${LANGUAGE_NAMES[lang]}`);
        }

        console.log(`[generate-question-translations] Translation complete - ${successCount} success, ${errorCount} errors`);

        // Check if there are still missing translations in other languages
        const { data: remainingCheck } = await supabase
          .from('question_translations')
          .select('question_id, lang')
          .in('lang', TARGET_LANGUAGES);

        const remainingMap = new Set<string>();
        if (remainingCheck) {
          for (const t of remainingCheck) {
            remainingMap.add(`${t.question_id}|${t.lang}`);
          }
        }

        let totalRemaining = 0;
        for (const huSource of hungarianSources) {
          for (const checkLang of TARGET_LANGUAGES) {
            const key = `${huSource.question_id}|${checkLang}`;
            if (!remainingMap.has(key)) {
              totalRemaining++;
            }
          }
        }

        sendProgress({ 
          type: 'complete', 
          message: targetLang 
            ? `${LANGUAGE_NAMES[targetLang]} kész! ${successCount} sikeres, ${errorCount} hiba${totalRemaining > 0 ? ` - ${totalRemaining} fordítás maradt más nyelveken` : ''}`
            : `Fordítás kész! ${successCount} sikeres, ${errorCount} hiba`,
          totalMissing,
          totalSuccess: successCount,
          totalErrors: errorCount,
          totalRemaining
        });

        controller.close();

      } catch (error) {
        console.error('[generate-question-translations] Fatal error:', error);
        sendProgress({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Ismeretlen hiba történt'
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});
