import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[fix-english-translations] Starting to fix English translations with Hungarian characters');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all English translations with Hungarian characters
    const { data: problematicTranslations } = await supabase
      .from('question_translations')
      .select('question_id, lang, question_text, answer_a, answer_b, answer_c')
      .eq('lang', 'en')
      .or('question_text.~*.[áéíóöőúüű],answer_a.~*.[áéíóöőúüű],answer_b.~*.[áéíóöőúüű],answer_c.~*.[áéíóöőúüű]');

    if (!problematicTranslations || problematicTranslations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No English translations with Hungarian characters found',
          stats: { total: 0, fixed: 0, errors: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[fix-english-translations] Found ${problematicTranslations.length} problematic English translations`);

    // Get Hungarian source translations for these questions
    const questionIds = [...new Set(problematicTranslations.map(t => t.question_id))];
    
    const { data: hungarianSources } = await supabase
      .from('question_translations')
      .select('question_id, question_text, answer_a, answer_b, answer_c')
      .eq('lang', 'hu')
      .in('question_id', questionIds);

    if (!hungarianSources) {
      throw new Error('Failed to fetch Hungarian source translations');
    }

    const huMap = new Map(hungarianSources.map(h => [h.question_id, h]));

    // Delete problematic English translations
    for (const item of problematicTranslations) {
      await supabase
        .from('question_translations')
        .delete()
        .eq('question_id', item.question_id)
        .eq('lang', 'en');
    }

    console.log(`[fix-english-translations] Deleted ${problematicTranslations.length} problematic translations`);

    // Re-translate in batches
    const BATCH_SIZE = 10;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
      const batchIds = questionIds.slice(i, i + BATCH_SIZE);
      const batchSources = batchIds
        .map(id => huMap.get(id))
        .filter(Boolean);

      if (batchSources.length === 0) continue;

      // Create prompt
      const batchTexts = batchSources.map((item, idx) => {
        return `${idx + 1}. Question: "${item!.question_text}"
   Answer A: "${item!.answer_a}"
   Answer B: "${item!.answer_b}"
   Answer C: "${item!.answer_c}"`;
      }).join('\n\n');

      const systemPrompt = `You are a professional translator specializing in translating Hungarian quiz questions to English.

CRITICAL RULES:
1. Translate EVERYTHING to pure English - NO Hungarian words or characters (áéíóöőúüű) allowed
2. If the Hungarian question contains Hungarian-specific terms (e.g., "lépcsőház"), translate them completely to English equivalents (e.g., "stairwell")
3. Translate naturally and idiomatically for English speakers
4. Maintain quiz question clarity and formatting
5. Keep answer order exactly as provided (A/B/C positions unchanged)

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

NO markdown, NO explanations, NO Hungarian characters, ONLY pure English translations in the numbered format above.`;

      const userPrompt = `Translate these ${batchSources.length} Hungarian quiz questions to pure English (no Hungarian characters allowed):

${batchTexts}

Remember: Translate EVERYTHING to English, including any Hungarian-specific terms.`;

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
          console.error(`[fix-english-translations] AI error:`, aiResponse.status, errorText);
          errorCount += batchSources.length;
          continue;
        }

        const aiData = await aiResponse.json();
        const translatedText = aiData.choices?.[0]?.message?.content?.trim() || '';
        
        if (!translatedText) {
          errorCount += batchSources.length;
          continue;
        }

        // Parse translations
        const questionBlocks = translatedText.split(/\n\n+/);
        
        for (let j = 0; j < batchSources.length; j++) {
          const source = batchSources[j];
          if (!source) continue;

          const blockPattern = new RegExp(`^${j + 1}\\.\\s*Question:`, 'i');
          const matchingBlock = questionBlocks.find((block: string) => blockPattern.test(block.trim()));

          if (!matchingBlock) {
            console.error(`[fix-english-translations] No translation found for question ${j + 1}`);
            errorCount++;
            continue;
          }

          const questionMatch = matchingBlock.match(/Question:\s*["']?([^"\n]+)["']?/i);
          const answerAMatch = matchingBlock.match(/A:\s*["']?([^"\n]+)["']?/i);
          const answerBMatch = matchingBlock.match(/B:\s*["']?([^"\n]+)["']?/i);
          const answerCMatch = matchingBlock.match(/C:\s*["']?([^"\n]+)["']?/i);

          if (!questionMatch || !answerAMatch || !answerBMatch || !answerCMatch) {
            console.error(`[fix-english-translations] Incomplete translation for question ${j + 1}`);
            errorCount++;
            continue;
          }

          const translatedQuestion = questionMatch[1].trim();
          const translatedA = answerAMatch[1].trim();
          const translatedB = answerBMatch[1].trim();
          const translatedC = answerCMatch[1].trim();

          // Insert new English translation
          const { error: insertError } = await supabase
            .from('question_translations')
            .insert({
              question_id: source.question_id,
              lang: 'en',
              question_text: translatedQuestion,
              answer_a: translatedA,
              answer_b: translatedB,
              answer_c: translatedC,
            });

          if (insertError) {
            console.error(`[fix-english-translations] Insert error for ${source.question_id}:`, insertError);
            errorCount++;
          } else {
            successCount++;
            console.log(`[fix-english-translations] ✓ Fixed ${source.question_id}`);
          }
        }

        console.log(`[fix-english-translations] Completed batch ${Math.floor(i / BATCH_SIZE) + 1}`);

      } catch (translateError) {
        console.error(`[fix-english-translations] Translation error:`, translateError);
        errorCount += batchSources.length;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`[fix-english-translations] Complete - ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Fixed ${successCount} English translations (${errorCount} errors)`,
        stats: {
          total: problematicTranslations.length,
          deleted: problematicTranslations.length,
          fixed: successCount,
          errors: errorCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[fix-english-translations] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
