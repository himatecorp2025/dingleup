import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LangCode = 'hu' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl';

const VALID_LANGUAGES: LangCode[] = ['hu', 'en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') as LangCode | null;

    if (!lang || !VALID_LANGUAGES.includes(lang)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing lang parameter. Must be one of: hu, en, de, fr, es, it, pt, nl' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[get-translations] Fetching translations for language:', lang);

    // Get total count first
    const { count, error: countError } = await supabase
      .from('translations')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('[get-translations] Count error:', countError);
      throw countError;
    }

    const totalCount = count || 0;
    console.log('[get-translations] Total translations in database:', totalCount);

    // Fetch all translations in batches (Supabase default limit is 1000)
    const batchSize = 1000;
    const allTranslations: any[] = [];
    
    for (let offset = 0; offset < totalCount; offset += batchSize) {
      const { data: batch, error: batchError } = await supabase
        .from('translations')
        .select(`key, hu, ${lang}`)
        .order('key')
        .range(offset, offset + batchSize - 1);

      if (batchError) {
        console.error('[get-translations] Batch error at offset', offset, ':', batchError);
        throw batchError;
      }

      if (batch && batch.length > 0) {
        allTranslations.push(...batch);
      }
    }

    if (allTranslations.length === 0) {
      console.log('[get-translations] No translations found in database');
      return new Response(
        JSON.stringify({ translations: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('[get-translations] Fetched', allTranslations.length, 'translations total');

    // Build translation map with fallback to Hungarian
    const translationMap: Record<string, string> = {};
    
    for (const row of allTranslations) {
      const key = row.key;
      const rowData = row as any; // Type assertion for dynamic column access
      const targetLangText = rowData[lang] as string | null;
      const fallbackText = row.hu; // Hungarian is always the source/fallback
      
      // Use target language if available, otherwise fallback to Hungarian
      translationMap[key] = targetLangText || fallbackText || key;
    }

    console.log('[get-translations] Returning', Object.keys(translationMap).length, 'translations');

    return new Response(
      JSON.stringify({ translations: translationMap }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[get-translations] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
