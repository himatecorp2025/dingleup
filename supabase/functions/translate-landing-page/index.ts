import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

/**
 * SAFE MODE Translation: Landing Page Content
 * 
 * Translates Landing Page UI keys to all 8 languages (en, de, fr, es, it, pt, nl)
 * Uses SAFE MODE with pre-flight checks and test mode validation
 */

type LangCode = 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl';

const TARGET_LANGUAGES: LangCode[] = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];

const GRAMMAR_RULES: Record<LangCode, string> = {
  en: `- American English spelling
- Action-oriented UI language  
- Title case for buttons and CTAs
- All caps for major emphasis
- Keep emoji positions`,
  
  de: `- Formal German (Sie-Form)
- Capitalize ALL nouns (German grammar)
- Title case for buttons
- Keep compound words together`,
  
  fr: `- Formal French (vous-form)
- Proper French accents (é, è, à, etc.)
- Gender agreement
- Title case for buttons`,
  
  es: `- Neutral Spanish
- Proper Spanish accents (á, é, í, ó, ú, ñ)
- Inverted exclamation marks (¡!)
- Gender agreement`,
  
  it: `- Standard Italian
- Proper Italian accents (à, è, é, ì, ò, ù)
- Gender agreement
- Title case for buttons`,
  
  pt: `- Brazilian Portuguese
- Proper Portuguese accents (á, â, ã, é, ê, í, ó, ô, õ, ú, ç)
- Gender agreement`,
  
  nl: `- Standard Dutch
- Proper Dutch spelling
- Keep compound words together
- Title case for buttons`
};

const LANDING_PAGE_KEYS = [
  // HERO SECTION
  'landing.hero.title_line1',
  'landing.hero.subtitle_line1',
  'landing.hero.cta_start_game',
  'landing.hero.cta_learn_more',
  'landing.hero.feature_daily_ranking',
  'landing.hero.feature_topics',
  'landing.hero.feature_questions',
  
  // DEVELOPMENT STATUS
  'landing.status.title_part1',
  'landing.status.subtitle',
  'landing.status.category_ux',
  'landing.status.category_ux_desc',
  'landing.status.category_game',
  'landing.status.category_game_desc',
  'landing.status.category_social',
  'landing.status.category_social_desc',
  'landing.status.category_testing',
  'landing.status.category_testing_desc',
  
  // COMING SOON
  'landing.status.upcoming_title_part1',
  'landing.status.upcoming_badge',
  'landing.status.feature_vip_title',
  'landing.status.feature_vip_desc',
  'landing.status.feature_analytics_title',
  'landing.status.feature_analytics_desc',
  'landing.status.feature_avatars_title',
  'landing.status.feature_avatars_desc',
  'landing.status.badge_soon',
  'landing.status.badge_planned',
  
  // NEWSLETTER
  'landing.newsletter.title',
  'landing.newsletter.subtitle',
  'landing.newsletter.button_subscribe',
  'landing.newsletter.no_spam',
  
  // FOOTER
  'landing.footer.description'
];

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { testMode = true, maxItems = 5 } = await req.json().catch(() => ({ testMode: true, maxItems: 5 }));

    // PRE-FLIGHT CHECKS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE environment not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // SAFE MODE: Test table accessibility
    const { error: tableError } = await supabase.from('translations').select('key').limit(1);
    if (tableError) {
      return new Response(
        JSON.stringify({ error: `Table access error: ${tableError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`[translate-landing-page] Mode: ${testMode ? 'TEST' : 'PRODUCTION'}, MaxItems: ${maxItems}`);

    // Fetch items to translate
    const keysToTranslate = testMode ? LANDING_PAGE_KEYS.slice(0, maxItems) : LANDING_PAGE_KEYS;

    const { data: items, error: fetchError } = await supabase
      .from('translations')
      .select('key, hu')
      .in('key', keysToTranslate);

    if (fetchError || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No items found to translate',
          totalFound: 0,
          stats: { attempted: 0, translated: 0, skipped: 0, errors: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[translate-landing-page] Found ${items.length} items to translate`);

    let translated = 0;
    let skipped = 0;
    let errors = 0;
    const errorSamples: string[] = [];

    // Process each item
    for (const item of items) {
      const huText = item.hu;
      if (!huText || huText.trim() === '') {
        skipped++;
        continue;
      }

      // Translate to all languages
      for (const lang of TARGET_LANGUAGES) {
        try {
          const prompt = `Translate this Hungarian UI text to ${lang.toUpperCase()}:

"${huText}"

CRITICAL RULES:
${GRAMMAR_RULES[lang]}

- NEVER copy the Hungarian text
- Must sound natural and fluent to native speakers
- Respect language-specific grammar (word order, gender, capitalization)
- Keep emoji in the same positions
- Maintain formatting (uppercase, title case, etc.)

Return ONLY the translated text, no explanations.`;

          const response = await fetch('https://api.lovable.app/v1/ai', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [{
                role: 'user',
                content: prompt
              }],
              max_tokens: 500,
              temperature: 0.3
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[translate-landing-page] AI error for ${lang}: ${response.status} ${errorText}`);
            
            // SAFE MODE: Halt on AI errors
            errors++;
            errorSamples.push(`${lang}: ${response.status} ${errorText.substring(0, 100)}`);
            
            // Stop processing on first AI error
            return new Response(
              JSON.stringify({
                error: 'AI translation failed - halting to prevent credit waste',
                errorDetails: errorSamples,
                stats: { attempted: items.length, translated, skipped, errors }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
          }

          const aiData = await response.json();
          const translatedText = aiData.choices?.[0]?.message?.content?.trim();

          if (!translatedText) {
            console.error(`[translate-landing-page] Empty translation for ${item.key} (${lang})`);
            errors++;
            errorSamples.push(`${item.key} (${lang}): Empty response`);
            continue;
          }

          // Update translation
          const { error: updateError } = await supabase
            .from('translations')
            .update({ [lang]: translatedText })
            .eq('key', item.key);

          if (updateError) {
            console.error(`[translate-landing-page] Update error for ${item.key} (${lang}):`, updateError);
            errors++;
            errorSamples.push(`${item.key} (${lang}): ${updateError.message}`);
          } else {
            translated++;
            console.log(`[translate-landing-page] ✓ ${item.key} → ${lang}: "${translatedText}"`);
          }

        } catch (error) {
          console.error(`[translate-landing-page] Exception for ${item.key} (${lang}):`, error);
          errors++;
          const errMsg = error instanceof Error ? error.message : String(error);
          errorSamples.push(`${item.key} (${lang}): ${errMsg}`);
        }
      }
    }

    const stats = {
      mode: testMode ? 'TEST' : 'PRODUCTION',
      maxItems,
      totalFound: items.length,
      attempted: items.length * TARGET_LANGUAGES.length,
      translated,
      skipped,
      errors,
      errorSamples: errorSamples.slice(0, 5)
    };

    console.log('[translate-landing-page] Complete:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Landing Page translation ${testMode ? 'TEST' : 'COMPLETE'}`,
        stats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[translate-landing-page] Fatal error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errMsg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
