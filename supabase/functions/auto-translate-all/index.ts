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

    // Parse request body for chunking parameters
    const { offset = 0, limit = 300 } = await req.json().catch(() => ({ offset: 0, limit: 300 }));
    console.log(`[auto-translate-all] Processing chunk: offset=${offset}, limit=${limit}`);

    // Step 1: Count total translations needing work
    const { count: totalCount } = await supabase
      .from('translations')
      .select('*', { count: 'exact', head: true })
      .not('hu', 'is', null);

    console.log(`[auto-translate-all] Total translations in database: ${totalCount}`);

    // Step 2: Fetch chunk of translations
    const { data: translations, error: fetchError } = await supabase
      .from('translations')
      .select('key, hu')
      .not('hu', 'is', null)
      .order('key')
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('[auto-translate-all] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!translations || translations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No more translations to process',
          hasMore: false,
          totalCount: totalCount || 0,
          processed: offset
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[auto-translate-all] Processing ${translations.length} translation keys (${offset} - ${offset + translations.length})`)

    const TARGET_LANGUAGES: LangCode[] = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];
    let successCount = 0;
    let errorCount = 0;

    // Step 2: Process each target language
    for (const lang of TARGET_LANGUAGES) {
      console.log(`[auto-translate-all] Starting translations to ${LANGUAGE_NAMES[lang]}`);

      // OPTIMIZED: Batch size 30 for speed + quality balance
      const BATCH_SIZE = 30;
      for (let i = 0; i < translations.length; i += BATCH_SIZE) {
        const batch = translations.slice(i, i + BATCH_SIZE);
        
        // Create batch prompt
        const batchTexts = batch.map((item, idx) => 
          `${idx + 1}. "${item.hu}"`
        ).join('\n');

        const systemPrompt = `You are a professional translator specializing in UI/UX localization for mobile gaming applications.

CRITICAL RULES:
1. **NEVER copy the Hungarian text** - You MUST translate, not copy!
2. **Use ${LANGUAGE_NAMES[lang]} grammar rules** - Apply proper ${LANGUAGE_NAMES[lang]} sentence structure, word order, verb conjugation, article usage, and punctuation
3. **Native ${LANGUAGE_NAMES[lang]} fluency** - Write as a native ${LANGUAGE_NAMES[lang]} speaker would write it naturally
4. **Gaming terminology**: kvíz=quiz, ranglista=leaderboard, booster=booster, jutalom=reward, arany=gold/coins, élet=life/lives
5. **Short UI text** - Keep button/label text concise and action-oriented
6. **Cultural localization** - Adapt expressions and tone for ${LANGUAGE_NAMES[lang]}-speaking users

GRAMMAR FOCUS: Pay special attention to ${LANGUAGE_NAMES[lang]} grammar:
- English: subject-verb-object order, articles (a/an/the), plural -s
- German: noun capitalization, cases (Nominativ/Akkusativ/Dativ/Genitiv), compound words
- French: gender agreement (le/la), accents (é/è/ê), liaison rules
- Spanish: gender agreement (el/la), verb conjugations, inverted question marks (¿?)
- Italian: gender agreement (il/la), verb endings (-are/-ere/-ire)
- Portuguese: gender agreement (o/a), verb conjugations, cedilla (ç), tildes (ã/õ)
- Dutch: word order (verb-second rule), diminutives (-je), compound words

Return translations in EXACT numbered format. NO explanations, NO notes, ONLY translations.`;

        const userPrompt = `Translate these ${batch.length} Hungarian UI texts to native ${LANGUAGE_NAMES[lang]} with PERFECT grammar (do NOT copy Hungarian text!). Return numbered format:\n\n${batchTexts}`;

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
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`[auto-translate-all] Completed ${LANGUAGE_NAMES[lang]}`);
    }

    console.log(`[auto-translate-all] Chunk complete - ${successCount} success, ${errorCount} errors`);

    const hasMore = (offset + translations.length) < (totalCount || 0);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: hasMore ? 'Chunk completed, more translations remaining' : 'All translations completed',
        stats: {
          total: translations.length * TARGET_LANGUAGES.length,
          success: successCount,
          errors: errorCount,
          languages: TARGET_LANGUAGES
        },
        hasMore,
        nextOffset: offset + translations.length,
        totalCount: totalCount || 0,
        progress: Math.round(((offset + translations.length) / (totalCount || 1)) * 100)
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
