import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LangCode = 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl';

const TARGET_LANGUAGES: LangCode[] = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[batch-translate-all] Starting batch translation...');

    // 1. Fetch all translations that need translation
    const { data: translations, error: fetchError } = await supabase
      .from('translations')
      .select('key, hu')
      .order('key');

    if (fetchError) throw fetchError;
    if (!translations || translations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No translations to process', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[batch-translate-all] Processing ${translations.length} translations`);

    let successCount = 0;
    let errorCount = 0;

    // 2. Process each translation
    for (const translation of translations) {
      console.log(`[batch-translate-all] Translating: ${translation.key}`);

      try {
        // Call translate-text function
        const translateResponse = await fetch(
          `${supabaseUrl}/functions/v1/translate-text`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              hungarianText: translation.hu,
              targetLanguages: TARGET_LANGUAGES
            })
          }
        );

        if (!translateResponse.ok) {
          const errorText = await translateResponse.text();
          console.error(`[batch-translate-all] Translation failed for ${translation.key}:`, translateResponse.status, errorText);
          errorCount++;
          continue;
        }

        const result = await translateResponse.json();
        const allTranslations = result.translations;

        // 3. Update the translation row with all languages
        const { error: updateError } = await supabase
          .from('translations')
          .update({
            en: allTranslations.en || translation.hu,
            de: allTranslations.de || translation.hu,
            fr: allTranslations.fr || translation.hu,
            es: allTranslations.es || translation.hu,
            it: allTranslations.it || translation.hu,
            pt: allTranslations.pt || translation.hu,
            nl: allTranslations.nl || translation.hu
          })
          .eq('key', translation.key);

        if (updateError) {
          console.error(`[batch-translate-all] Update failed for ${translation.key}:`, updateError);
          errorCount++;
          continue;
        }

        successCount++;
        console.log(`[batch-translate-all] ✓ ${translation.key} (${successCount}/${translations.length})`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`[batch-translate-all] Error processing ${translation.key}:`, error);
        errorCount++;
      }
    }

    console.log(`[batch-translate-all] Complete! Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        message: 'Batch translation complete',
        total: translations.length,
        success: successCount,
        errors: errorCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[batch-translate-all] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
