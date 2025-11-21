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
const BATCH_SIZE = 10; // Process 10 questions at a time

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get all questions that need translation
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question, answers, correct_answer')
      .order('created_at', { ascending: true });

    if (questionsError) throw questionsError;
    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No questions to translate' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[generate-question-translations] Found ${questions.length} active questions`);

    let translatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process questions in batches
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      console.log(`[generate-question-translations] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(questions.length / BATCH_SIZE)}`);

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

            // Prepare AI prompt
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

            // Extract answers from JSONB array
            const answers = question.answers as any[];
            const answerA = answers[0]?.text || '';
            const answerB = answers[1]?.text || '';
            const answerC = answers[2]?.text || '';

            const userPrompt = `Translate this Hungarian quiz question to ${LANGUAGE_NAMES[lang]}:

Question: ${question.question}
Answer A: ${answerA}
Answer B: ${answerB}
Answer C: ${answerC}
Correct answer: ${question.correct_answer}

Remember: Keep the same answer positions (A/B/C). The correct answer is marked as "${question.correct_answer}" and must remain in that position after translation.`;

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
                max_tokens: 500
              })
            });

            if (!aiResponse.ok) {
              const errorText = await aiResponse.text();
              console.error(`[generate-question-translations] AI error for ${lang}:`, aiResponse.status, errorText);
              
              if (aiResponse.status === 429) {
                errors.push(`Rate limit exceeded for ${lang}`);
                continue;
              }
              if (aiResponse.status === 402) {
                errors.push(`Payment required for ${lang}`);
                continue;
              }
              
              errors.push(`Translation failed for question ${question.id} (${lang})`);
              continue;
            }

            const aiData = await aiResponse.json();
            const translatedText = aiData.choices?.[0]?.message?.content?.trim() || '';
            
            if (!translatedText) {
              errors.push(`Empty translation for question ${question.id} (${lang})`);
              continue;
            }

            // Parse JSON response
            let translated;
            try {
              // Remove markdown code blocks if present
              const cleanText = translatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              translated = JSON.parse(cleanText);
            } catch (e) {
              console.error(`[generate-question-translations] JSON parse error for question ${question.id} (${lang}):`, translatedText);
              errors.push(`Invalid JSON for question ${question.id} (${lang})`);
              continue;
            }

            // Validate structure
            if (!translated.question || !translated.a || !translated.b || !translated.c) {
              errors.push(`Incomplete translation for question ${question.id} (${lang})`);
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
            }

          } catch (error) {
            console.error(`[generate-question-translations] Error translating question ${question.id} to ${lang}:`, error);
            errors.push(`Error for question ${question.id} (${lang}): ${error instanceof Error ? error.message : 'Unknown'}`);
          }
        }
      }

      // Small delay between batches
      if (i + BATCH_SIZE < questions.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`[generate-question-translations] Complete! Translated: ${translatedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`);

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
