import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LangCode = 'hu' | 'en';

const VALID_LANGUAGES: LangCode[] = ['hu', 'en'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') as LangCode | null;

    if (!lang || !VALID_LANGUAGES.includes(lang)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing lang parameter. Must be one of: hu, en' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[get-translations] Fetching translations for language:', lang);

    const PAGE_SIZE = 1000;
    const allTranslations: any[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('translations')
        .select(`key, hu, en, ${lang}`)
        .order('key')
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('[get-translations] Error loading page starting at', from, error);
        throw error;
      }

      if (!data || data.length === 0) {
        break;
      }

      allTranslations.push(...data);

      if (data.length < PAGE_SIZE) {
        break;
      }

      from += PAGE_SIZE;
    }

    if (!allTranslations || allTranslations.length === 0) {
      console.log('[get-translations] No translations found');
      return new Response(
        JSON.stringify({ translations: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('[get-translations] Fetched', allTranslations.length, 'translations');

    // Build translation map with fallback chain: target → en → hu
    const translationMap: Record<string, string> = {};
    
    for (const row of allTranslations) {
      const key = row.key;
      const rowData = row as any;
      const targetLangText = rowData[lang] as string | null;
      const englishText = row.en as string | null;
      const hungarianText = row.hu;
      
      // CRITICAL: Check if translation exists (even if empty string)
      // Empty string is a valid translation (intentionally blank), not missing
      // Only use fallback when value is NULL/undefined
      if (targetLangText !== null && targetLangText !== undefined) {
        translationMap[key] = targetLangText;
      } else if (englishText !== null && englishText !== undefined) {
        translationMap[key] = englishText;
      } else {
        translationMap[key] = hungarianText || key;
      }
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
