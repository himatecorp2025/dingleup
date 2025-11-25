import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LangCode = 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl';

const LANGUAGE_NAMES: Record<LangCode, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const targetLang = body.targetLang as LangCode;
    const offset = body.offset ?? 0;
    const limit = body.limit ?? 50;

    if (!targetLang) {
      return new Response(
        JSON.stringify({ error: 'targetLang parameter required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[generate-question-translations] Processing ${targetLang}: offset=${offset}, limit=${limit}`);

    // Count total questions
    const { count: totalCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    console.log(`[generate-question-translations] Total questions: ${totalCount}`);

    // Fetch chunk of questions
    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('id, question, answers')
      .order('id')
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('[generate-question-translations] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
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

    console.log(`[generate-question-translations] Processing ${questions.length} questions`);

    // Check which questions already have translations
    const { data: existingTranslations } = await supabase
      .from('question_translations')
      .select('question_id')
      .eq('lang', targetLang)
      .in('question_id', questions.map(q => q.id));

    const existingIds = new Set(existingTranslations?.map(t => t.question_id) || []);
    const questionsToTranslate = questions.filter(q => !existingIds.has(q.id));

    console.log(`[generate-question-translations] ${questionsToTranslate.length} questions need translation, ${existingIds.size} already exist`);

    let successCount = 0;
    let errorCount = 0;
    const skippedExisting = existingIds.size;

    if (questionsToTranslate.length > 0) {
      // Process in batches of 10 for AI call
      const BATCH_SIZE = 10;
      for (let i = 0; i < questionsToTranslate.length; i += BATCH_SIZE) {
        const batch = questionsToTranslate.slice(i, i + BATCH_SIZE);

        // Build batch prompt
        const batchText = batch.map((q, idx) => {
          const answers = q.answers as { A: string; B: string; C: string };
          return `${idx + 1}. Question: "${q.question}"\n   A) "${answers.A}"\n   B) "${answers.B}"\n   C) "${answers.C}"`;
        }).join('\n\n');

        const systemPrompt = `You are a professional translator specializing in quiz/trivia content localization from Hungarian to ${LANGUAGE_NAMES[targetLang]}.

CRITICAL RULES:
1. Translate question and all 3 answers naturally and idiomatically for ${LANGUAGE_NAMES[targetLang]}-speaking users
2. Maintain the EXACT SAME meaning and difficulty level
3. Keep questions under 75 characters
4. Keep answers under 50 characters each
5. Preserve factual accuracy - do NOT change correct answers or facts
6. Return ONLY numbered format with question and answers

RESPONSE FORMAT:
1. Question: "translated question"
   A) "translated answer A"
   B) "translated answer B"
   C) "translated answer C"

2. Question: "translated question"
   ...`;

        const userPrompt = `Translate these ${batch.length} Hungarian quiz questions and answers to native ${LANGUAGE_NAMES[targetLang]}:\n\n${batchText}`;

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
              temperature: 0.3
            })
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`[generate-question-translations] AI error:`, aiResponse.status, errorText);

            if (aiResponse.status === 402) {
              throw new Error('PAYMENT_REQUIRED: Lovable AI credits exhausted');
            }
            if (aiResponse.status === 429) {
              throw new Error('RATE_LIMIT: AI API rate limit hit');
            }
            if (aiResponse.status >= 500) {
              throw new Error(`AI_SERVER_ERROR: ${aiResponse.status}`);
            }

            errorCount += batch.length;
            continue;
          }

          const aiData = await aiResponse.json();
          const translatedText = aiData.choices?.[0]?.message?.content?.trim() || '';

          // Parse numbered translations
          const sections = translatedText.split(/\n\n+/);
          
          for (let j = 0; j < batch.length; j++) {
            const question = batch[j];
            const section = sections[j];

            if (!section) {
              errorCount++;
              continue;
            }

            // Extract question and answers
            const questionMatch = section.match(/Question:\s*["']([^"']+)["']/i);
            const answerAMatch = section.match(/A\)\s*["']([^"']+)["']/i);
            const answerBMatch = section.match(/B\)\s*["']([^"']+)["']/i);
            const answerCMatch = section.match(/C\)\s*["']([^"']+)["']/i);

            if (!questionMatch || !answerAMatch || !answerBMatch || !answerCMatch) {
              console.error(`[generate-question-translations] Parse error for question ${question.id}`);
              errorCount++;
              continue;
            }

            const translatedQuestion = questionMatch[1];
            const translatedA = answerAMatch[1];
            const translatedB = answerBMatch[1];
            const translatedC = answerCMatch[1];

            // Insert translation with correct column names
            const { error: insertError } = await supabase
              .from('question_translations')
              .insert({
                question_id: question.id,
                lang: targetLang,
                question_text: translatedQuestion,
                answer_a: translatedA,
                answer_b: translatedB,
                answer_c: translatedC
              });

            if (insertError) {
              console.error(`[generate-question-translations] Insert error for ${question.id}:`, insertError);
              errorCount++;
            } else {
              successCount++;
            }
          }

          console.log(`[generate-question-translations] Batch ${Math.floor(i / BATCH_SIZE) + 1} complete`);

        } catch (error) {
          console.error(`[generate-question-translations] Batch error:`, error);
          errorCount += batch.length;
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    const hasMore = (offset + questions.length) < (totalCount || 0);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: hasMore ? 'Chunk completed, more questions remaining' : 'All questions completed',
        stats: {
          totalFound: questions.length,
          attempted: questionsToTranslate.length,
          translated: successCount,
          skippedExisting: skippedExisting,
          errors: errorCount
        },
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
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
