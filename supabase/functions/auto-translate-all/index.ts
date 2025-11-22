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

        const systemPrompt = `You are a professional translator specializing in UI/UX localization for DingleUP!, a Hungarian trivia game application.

ABSOLUTE RULES - NO EXCEPTIONS:
1. **NEVER copy or duplicate the Hungarian source text** into any target language field
2. Every translation MUST be in the target language's native form - no Hungarian words allowed
3. Apply the grammatical rules specific to ${LANGUAGE_NAMES[lang]}:

${lang === 'en' ? `ENGLISH GRAMMAR RULES:
- SVO word order (Subject-Verb-Object)
- Proper use of articles: a/an/the (a before consonants, an before vowels, the for specific items)
- No grammatical gender
- Natural contractions where appropriate (don't, can't, it's)
- Idiomatic expressions - translate meaning, not word-for-word
- Plural -s/-es endings
- Verb tenses: present simple for facts, present continuous for ongoing actions` : ''}

${lang === 'de' ? `GERMAN GRAMMAR RULES:
- ALL nouns MUST be capitalized (Spiel, Rangliste, Benutzer)
- Grammatical gender: der (masculine), die (feminine), das (neuter)
- Compound nouns written as ONE word (Rangliste, Spielprofil, Benutzereinstellungen)
- Cases: Nominativ (subject), Akkusativ (direct object), Dativ (indirect object), Genitiv (possession)
- Verb placement: verb-second in main clauses, verb-final in subordinate clauses
- Formal Sie vs informal du/ihr - use Sie for app UI
- Umlauts are MANDATORY: ä, ö, ü, ß` : ''}

${lang === 'fr' ? `FRENCH GRAMMAR RULES:
- Grammatical gender: le (masculine), la (feminine), les (plural)
- Noun-adjective gender/number agreement (le jeu amusant, la partie amusante)
- Elision rules: le/la → l' before vowels (l'utilisateur, l'application)
- Accents and diacritics are MANDATORY: é, è, ê, à, ç, ù
- Formal vous vs informal tu - use vous for app UI
- Contractions: de + le = du, à + le = au
- Liaison awareness in pronunciation-based text` : ''}

${lang === 'es' ? `SPANISH GRAMMAR RULES:
- Grammatical gender: el (masculine), la (feminine)
- Noun-adjective gender/number agreement (el juego divertido, la partida divertida)
- Verb conjugations MUST match subject (yo juego, tú juegas, él juega)
- Question marks and exclamation points at START and END (¿Cómo? ¡Genial!)
- Accents are MANDATORY: á, é, í, ó, ú, ñ
- Use tú/vosotros for informal, usted/ustedes for formal - app UI typically uses tú
- Double R and double L maintained (carro, llamar)` : ''}

${lang === 'it' ? `ITALIAN GRAMMAR RULES:
- Grammatical gender: il/lo (masculine), la (feminine), i/gli/le (plural)
- Noun-adjective gender/number agreement (il gioco divertente, la partita divertente)
- Elision rules: lo/la → l' before vowels (l'utente, l'applicazione)
- Double consonants MUST be preserved (applicazione, messaggio, successivo)
- Verb endings match subject: -are (giocare), -ere (vincere), -ire (finire)
- Accents where needed: à, è, é, ì, ò, ù
- Prepositions contract: di + il = del, a + il = al` : ''}

${lang === 'pt' ? `PORTUGUESE GRAMMAR RULES:
- Grammatical gender: o (masculine), a (feminine), os/as (plural)
- Noun-adjective gender/number agreement (o jogo divertido, a partida divertida)
- Verb conjugations rich and context-dependent (eu jogo, tu jogas, ele joga)
- Accents and tildes are MANDATORY: ã, õ, á, é, í, ó, ú, â, ê, ô
- Brazilian vs European Portuguese: adapt naturally (app → aplicativo/aplicação)
- Contractions: de + o = do, em + o = no
- Cedilla (ç) required in specific contexts (começar, serviço)` : ''}

${lang === 'nl' ? `DUTCH GRAMMAR RULES:
- Grammatical gender: de (common gender), het (neuter)
- Word order: V2 rule - verb second in main clauses (Ik speel het spel)
- Compound nouns are common and written as one word (spelersprofiel, ranglijst)
- Diminutives with -je/-tje/-pje (spelletje, kadootje)
- Natural, conversational tone
- Double vowels and consonants maintained (speel, koffie, groen)
- Separable verbs: prefix can split (uitloggen → ik log uit)` : ''}

TRANSLATION QUALITY REQUIREMENTS:
- Translate the MEANING and TONE, not word-for-word
- Use natural, fluent phrasing as a native ${LANGUAGE_NAMES[lang]} speaker would write
- Adapt cultural references and idioms appropriately for ${LANGUAGE_NAMES[lang]}-speaking users
- Gaming terminology: kvíz→quiz/trivia, ranglista→leaderboard, booster→power-up/booster, jutalom→reward, arany→gold/coins, élet→life/lives
- Keep UI text concise and action-oriented for buttons/labels
- Preserve ALL formatting markers: {{variables}}, %s, <tags>, etc.
- Ensure gender, number, and case agreement in all inflected languages

Source language: Hungarian (hu)
Target language: ${LANGUAGE_NAMES[lang]} (${lang})

Your task: Produce professional, native-quality translations that feel natural to ${LANGUAGE_NAMES[lang]} speakers. Return ONLY numbered translations, NO explanations.`;

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
