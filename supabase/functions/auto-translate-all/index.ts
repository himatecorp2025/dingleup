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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[auto-translate-all] Function invoked');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('[auto-translate-all] Starting automatic translation for all UI texts');

    // Step 1: Fetch ALL translations using pagination (1000-row backend limit)
    const translations: Array<{ key: string; hu: string }> = [];
    const PAGE_SIZE = 500;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error: fetchError } = await supabase
        .from('translations')
        .select('key, hu')
        .not('hu', 'is', null)
        .order('key')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) {
        console.error('[auto-translate-all] Fetch error:', fetchError);
        throw fetchError;
      }

      if (batch && batch.length > 0) {
        translations.push(...batch);
        console.log(`[auto-translate-all] Fetched page ${page + 1}: ${batch.length} keys (total: ${translations.length})`);
        page++;
        hasMore = batch.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    if (translations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No translations to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[auto-translate-all] Processing ${translations.length} translation keys`);

    const TARGET_LANGUAGES: LangCode[] = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];
    let successCount = 0;
    let errorCount = 0;

    // Step 2: Process each target language
    for (const lang of TARGET_LANGUAGES) {
      console.log(`[auto-translate-all] Starting translations to ${LANGUAGE_NAMES[lang]}`);

      // Process in batches of 50 to avoid overwhelming the AI API
      const BATCH_SIZE = 50;
      for (let i = 0; i < translations.length; i += BATCH_SIZE) {
        const batch = translations.slice(i, i + BATCH_SIZE);
        
        // Create batch prompt
        const batchTexts = batch.map((item, idx) => 
          `${idx + 1}. "${item.hu}"`
        ).join('\n');

        const systemPrompt = `You are a professional translator specializing in UI/UX localization for mobile gaming applications.
Your task is to translate Hungarian text into ${LANGUAGE_NAMES[lang]} while maintaining:
1. **Grammatical correctness** - Use proper ${LANGUAGE_NAMES[lang]} grammar, syntax, and punctuation
2. Natural, native-speaker fluency and idiomatic expressions
3. Appropriate gaming/app terminology (kvíz=quiz, ranglista=leaderboard, booster=booster, jutalom=reward, arany=gold/coins, élet=life/lives)
4. Consistent tone and style appropriate for ${LANGUAGE_NAMES[lang]}-speaking audiences
5. Short, concise UI text for buttons and labels
6. Cultural appropriateness and localization (not just literal translation)

CRITICAL: Return translations in the EXACT same numbered format as the input. Each line must start with the number followed by the translation.
Do NOT add explanations, notes, or extra formatting. ONLY numbered translations.`;

        const userPrompt = `Translate these ${batch.length} Hungarian UI texts to ${LANGUAGE_NAMES[lang]} with perfect grammar. Return them in numbered format (1. translation_here):\n\n${batchTexts}`;

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
              max_tokens: 3000
            })
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`[auto-translate-all] AI API error for ${lang}:`, aiResponse.status, errorText);
            errorCount += batch.length;
            continue;
          }

          const aiData = await aiResponse.json();
          const translatedText = aiData.choices?.[0]?.message?.content?.trim() || '';
          
          // Parse numbered translations
          const lines = translatedText.split('\n').filter((line: string) => line.trim());
          
          // Update each translation in database
          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const matchingLine = lines.find((line: string) => 
              line.trim().match(new RegExp(`^${j + 1}\\.\\s*`))
            );

            let translation = item.hu; // Fallback to Hungarian
            
            if (matchingLine) {
              translation = matchingLine
                .replace(new RegExp(`^${j + 1}\\.\\s*`), '')
                .replace(/^["']|["']$/g, '')
                .trim();
            }

            // Update the database
            const { error: updateError } = await supabase
              .from('translations')
              .update({ [lang]: translation })
              .eq('key', item.key);

            if (updateError) {
              console.error(`[auto-translate-all] Update error for key ${item.key}:`, updateError);
              errorCount++;
            } else {
              successCount++;
            }
          }

          console.log(`[auto-translate-all] Completed batch ${Math.floor(i / BATCH_SIZE) + 1} for ${lang} (${successCount} success, ${errorCount} errors)`);

        } catch (translateError) {
          console.error(`[auto-translate-all] Translation error for ${lang}:`, translateError);
          errorCount += batch.length;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`[auto-translate-all] Completed ${LANGUAGE_NAMES[lang]}`);
    }

    console.log(`[auto-translate-all] All translations complete - ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Translation process completed',
        stats: {
          total: translations.length * TARGET_LANGUAGES.length,
          success: successCount,
          errors: errorCount,
          languages: TARGET_LANGUAGES
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[auto-translate-all] Error:', error);
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
