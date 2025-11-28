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
    const criticalOnly = url.searchParams.get('critical') === 'true';

    if (!lang || !VALID_LANGUAGES.includes(lang)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing lang parameter. Must be one of: hu, en' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[get-translations] Fetching translations for language:', lang, 'critical:', criticalOnly);

    // OPTIMIZATION: If criticalOnly, fetch only essential keys for fast initial render
    const CRITICAL_PREFIXES = [
      'auth.', 'common.', 'dashboard.', 'game.', 'daily_gift.',
      'welcome_bonus.', 'dailyWinners.', 'profile.', 'leaderboard.'
    ];

    let query = supabase
      .from('translations')
      .select(`key, hu, en, ${lang}`)
      .order('key');

    if (criticalOnly) {
      // Filter to critical keys only (much smaller dataset)
      const orFilters = CRITICAL_PREFIXES.map(prefix => `key.ilike.${prefix}%`).join(',');
      query = query.or(orFilters).limit(500);
    }

    const { data: translations, error } = await query;

    if (error) {
      console.error('[get-translations] Error:', error);
      throw error;
    }

    if (!translations || translations.length === 0) {
      console.log('[get-translations] No translations found');
      return new Response(
        JSON.stringify({ translations: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('[get-translations] Fetched', translations.length, 'translations');

    // Build translation map with fallback chain: target → en → hu
    const translationMap: Record<string, string> = {};
    
    for (const row of translations) {
      const key = row.key;
      const rowData = row as any;
      const targetLangText = rowData[lang] as string | null;
      const englishText = row.en as string | null;
      const hungarianText = row.hu;
      
      // Fallback chain: target language → English → Hungarian → key
      if (targetLangText && targetLangText.trim() !== '') {
        translationMap[key] = targetLangText;
      } else if (englishText && englishText.trim() !== '') {
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
