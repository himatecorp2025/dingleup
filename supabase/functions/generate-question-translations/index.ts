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
const BATCH_SIZE = 10; // Increased batch size for faster processing
const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay
const MAX_RETRIES = 3;
const RETRY_DELAY = 10000; // 10 seconds between retries
const MAX_QUESTIONS_PER_RUN = 500; // Process max 500 questions per invocation

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
  retries = MAX_RETRIES
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

  for (let attempt = 0; attempt < retries; attempt++) {
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

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`[translate-retry] AI error for ${lang} (attempt ${attempt + 1}/${retries}):`, aiResponse.status, errorText);
        
        // If payment required (out of credits), fail immediately without retry
        if (aiResponse.status === 402) {
          throw new Error('PAYMENT_REQUIRED: Lovable AI credits exhausted');
        }
        
        // For rate limits, retry after delay
        if (aiResponse.status === 429) {
          if (attempt < retries - 1) {
            console.log(`[translate-retry] Retrying after ${RETRY_DELAY}ms...`);
            await delay(RETRY_DELAY);
            continue;
          }
        }
        return null;
      }

      const aiData = await aiResponse.json();
      const translatedText = aiData.choices?.[0]?.message?.content?.trim() || '';
      
      if (!translatedText) {
        return null;
      }

      // Parse JSON response
      const cleanText = translatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const translated = JSON.parse(cleanText);

      // Validate structure
      if (!translated.question || !translated.a || !translated.b || !translated.c) {
        return null;
      }

      return translated;

    } catch (error) {
      console.error(`[translate-retry] Error on attempt ${attempt + 1}/${retries}:`, error);
      if (attempt < retries - 1) {
        await delay(RETRY_DELAY);
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Create broadcast channel for real-time progress updates
    const progressChannel = supabase.channel('question-translation-progress');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch questions using pagination (1000-row Lovable Cloud backend limit)
    const allQuestions: Array<{ id: string; question: string; answers: any; correct_answer: string | null }> = [];
    const PAGE_SIZE = 500;
    let page = 0;
    let hasMore = true;

    while (hasMore && allQuestions.length < MAX_QUESTIONS_PER_RUN * 2) { // Fetch up to 2x max to have buffer
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

    // Filter to questions that need translation (missing at least one target language)
    const questionsNeedingTranslation: typeof allQuestions = [];
    for (const q of allQuestions) {
      let needsTranslation = false;
      for (const lang of TARGET_LANGUAGES) {
        const { data: existing } = await supabase
          .from('question_translations')
          .select('id')
          .eq('question_id', q.id)
          .eq('lang', lang)
          .single();
        if (!existing) {
          needsTranslation = true;
          break;
        }
      }
      if (needsTranslation) {
        questionsNeedingTranslation.push(q);
      }
      // Limit to MAX_QUESTIONS_PER_RUN
      if (questionsNeedingTranslation.length >= MAX_QUESTIONS_PER_RUN) {
        break;
      }
    }

    const questions = questionsNeedingTranslation;

    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No questions to translate' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[generate-question-translations] Found ${questions.length} active questions`);

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
    let processedQuestions = 0;
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
      
      console.log(`[generate-question-translations] Processing batch ${batchNumber}/${totalBatches}`);

      // Broadcast batch progress
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
          // Extract answers from JSONB array
          const answers = question.answers as any[];
          
          // Insert Hungarian source
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
            // Check if translation exists
            const { data: existing } = await supabase
              .from('question_translations')
              .select('id')
              .eq('question_id', question.id)
              .eq('lang', lang)
              .single();

            if (existing) {
              skippedCount++;
              continue;
            }

            // Extract answers from JSONB array
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
                lang
              );
            } catch (error) {
              // If payment required, stop entire process immediately
              if (error instanceof Error && error.message.includes('PAYMENT_REQUIRED')) {
                console.error('[generate-question-translations] CRITICAL: Out of Lovable AI credits');
                throw new Error('Lovable AI credits exhausted. Please add credits to your workspace at Settings → Workspace → Usage.');
              }
              throw error;
            }

            if (!translated) {
              errors.push(`Translation failed for question ${question.id} (${lang}) after ${MAX_RETRIES} retries`);
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
              console.error(`[generate-question-translations] Insert error:`, insertError);
              errors.push(`Insert failed for question ${question.id} (${lang})`);
            } else {
              translatedCount++;
              console.log(`[generate-question-translations] ✓ Question ${question.id} translated to ${lang}`);
              
              // Broadcast progress after each successful translation
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

      processedQuestions += batch.length;

      // Longer delay between batches to avoid rate limits
      if (i + BATCH_SIZE < questions.length) {
        console.log(`[generate-question-translations] Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log(`[generate-question-translations] Complete! Translated: ${translatedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`);

    // Broadcast final progress
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

    // Unsubscribe from channel
    await supabase.removeChannel(progressChannel);

    return new Response(
      JSON.stringify({
        success: true,
        translated: translatedCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined
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
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
