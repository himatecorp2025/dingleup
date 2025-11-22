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

const TARGET_LANGUAGES: LangCode[] = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];

// UI fordítási grammatikai szabályok nyelvenként
const GRAMMAR_RULES: Record<LangCode, string> = {
  en: `- Use American English spelling
- Keep UI text concise and action-oriented
- Use title case for buttons (e.g., "Play Now", "Speed Boost")
- Use all caps for emphasis (e.g., "DAILY GIFT", "YOU LOSE!")
- Maintain emoji positions in text`,
  
  de: `- Use formal German (Sie-Form for instructions)
- Capitalize all nouns (German grammar rule)
- Keep compound words together (e.g., Geschwindigkeitsbonus)
- Use title case for buttons
- Use all caps for emphasis where appropriate`,
  
  fr: `- Use formal French (vous-form)
- Apply proper French accents (é, è, à, etc.)
- Maintain gender agreement
- Use title case for buttons
- Use all caps sparingly, only for major emphasis`,
  
  es: `- Use neutral Spanish (not regional dialects)
- Apply proper Spanish accents (á, é, í, ó, ú, ñ)
- Use inverted exclamation marks (¡!) where grammatically correct
- Use title case for buttons
- Maintain gender agreement`,
  
  it: `- Use standard Italian
- Apply proper Italian accents (à, è, é, ì, ò, ù)
- Maintain gender agreement
- Use title case for buttons
- Use all caps sparingly`,
  
  pt: `- Use Brazilian Portuguese spelling
- Apply proper Portuguese accents (á, â, ã, é, ê, í, ó, ô, õ, ú, ç)
- Maintain gender agreement
- Use title case for buttons`,
  
  nl: `- Use standard Dutch (not Flemish variations)
- Apply proper Dutch spelling
- Use title case for buttons
- Keep compound words together (e.g., snelheidsboost)`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[translate-ui-elements] Starting UI elements translation...');

    // Lekérjük a lefordítandó UI elemeket (ahol en IS NULL)
    const { data: items, error: fetchError } = await supabase
      .from('translations')
      .select('key, hu')
      .in('key', [
        'daily.day_label',
        'daily.title',
        'dashboard.play_now',
        'dashboard.premium_booster_price',
        'dashboard.speed_boost_button',
        'dashboard.speed_booster',
        'dialog.daily_gift.day',
        'dialog.daily_gift.sr_title',
        'dialog.daily_gift.title',
        'dialog.rescue.premium_title',
        'game_state.total_score',
        'game_state.you_lose',
        'game_state.your_score',
        'lifeline.skip.name',
        'lives.speed_boost',
        'next_life.max_lives',
        'timer.speed_boost',
        'welcome.title',
        'profile.free_booster'
      ])
      .is('en', null);

    if (fetchError) {
      console.error('[translate-ui-elements] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!items || items.length === 0) {
      console.log('[translate-ui-elements] No UI elements to translate (all already translated)');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All UI elements already translated',
          translated: 0,
          skipped: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[translate-ui-elements] Found ${items.length} UI elements to translate`);

    let totalTranslated = 0;
    let totalErrors = 0;

    // Fordítunk minden célnyelvre
    for (const targetLang of TARGET_LANGUAGES) {
      console.log(`[translate-ui-elements] Translating to ${LANGUAGE_NAMES[targetLang]}...`);

      // Készítjük elő a promptot
      const itemsText = items
        .map((item, i) => `${i + 1}. Key: "${item.key}"\n   Hungarian: "${item.hu}"`)
        .join('\n\n');

      const systemPrompt = `You are a professional translator specializing in game UI localization from Hungarian to ${LANGUAGE_NAMES[targetLang]}.

CRITICAL RULES:
1. Translate UI text naturally and idiomatically for ${LANGUAGE_NAMES[targetLang]}-speaking gamers
2. Preserve ALL placeholders EXACTLY as they appear (e.g., {{day}}, {current}, {total})
3. Preserve ALL emojis in their exact positions (e.g., 🔥, 🪙, 💚)
4. Maintain text formatting (UPPERCASE, Title Case, punctuation)
5. Keep the tone energetic and game-appropriate
6. DO NOT translate brand names (Premium Booster, Speed Boost, Daily Gift can stay or be adapted)

${LANGUAGE_NAMES[targetLang]}-SPECIFIC GRAMMAR RULES:
${GRAMMAR_RULES[targetLang]}

RESPONSE FORMAT:
Return ONLY a valid JSON object with this structure:
{
  "translations": {
    "translation_key_1": "translated text 1",
    "translation_key_2": "translated text 2",
    ...
  }
}`;

      const userPrompt = `Translate these ${items.length} Hungarian game UI texts to ${LANGUAGE_NAMES[targetLang]}:

${itemsText}

Remember:
- Keep placeholders like {{day}}, {current}, {total} EXACTLY as they are
- Keep emojis like 🔥, 🪙, 💚 in their positions
- Maintain UPPERCASE for emphasis (e.g., "DAILY GIFT" → "${targetLang === 'de' ? 'TÄGLICHES GESCHENK' : 'translate accordingly'}")
- Use natural, game-appropriate language`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`[translate-ui-elements] AI error for ${targetLang}:`, aiResponse.status, errorText);
          
          if (aiResponse.status === 402) {
            return new Response(
              JSON.stringify({ error: 'PAYMENT_REQUIRED: Lovable AI credits exhausted' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
            );
          }
          
          if (aiResponse.status === 429) {
            return new Response(
              JSON.stringify({ error: 'RATE_LIMIT: Too many requests to AI' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
            );
          }
          
          totalErrors++;
          continue;
        }

        const aiData = await aiResponse.json();
        const translatedContent = aiData.choices?.[0]?.message?.content;

        if (!translatedContent) {
          console.error(`[translate-ui-elements] No content from AI for ${targetLang}`);
          totalErrors++;
          continue;
        }

        const parsed = JSON.parse(translatedContent);
        const translations = parsed.translations || {};

        console.log(`[translate-ui-elements] Parsed ${Object.keys(translations).length} translations for ${targetLang}`);

        // Frissítjük az adatbázist batch-enként
        let successCount = 0;
        for (const item of items) {
          const translatedText = translations[item.key];
          
          if (!translatedText) {
            console.warn(`[translate-ui-elements] Missing translation for ${item.key} in ${targetLang}`);
            continue;
          }

          const { error: updateError } = await supabase
            .from('translations')
            .update({ [targetLang]: translatedText })
            .eq('key', item.key);

          if (updateError) {
            console.error(`[translate-ui-elements] Update error for ${item.key}:`, updateError);
            totalErrors++;
          } else {
            successCount++;
            totalTranslated++;
          }
        }

        console.log(`[translate-ui-elements] ${LANGUAGE_NAMES[targetLang]}: ${successCount}/${items.length} successfully translated`);

      } catch (error) {
        console.error(`[translate-ui-elements] Error translating to ${targetLang}:`, error);
        totalErrors++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'UI elements translation completed',
        items_count: items.length,
        languages: TARGET_LANGUAGES.length,
        total_translated: totalTranslated,
        total_errors: totalErrors,
        expected_total: items.length * TARGET_LANGUAGES.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[translate-ui-elements] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
