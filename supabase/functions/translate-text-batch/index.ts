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

interface TranslationItem {
  key: string;
  hu: string;
}

interface BatchResult {
  key: string;
  translations: Record<string, string>;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create broadcast channel for real-time progress updates
    const progressChannel = supabase.channel('ui-translation-progress');

    const { items, targetLanguages } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'items must be a non-empty array' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!Array.isArray(targetLanguages) || targetLanguages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'targetLanguages must be a non-empty array' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`[translate-text-batch] Processing ${items.length} items for languages:`, targetLanguages);

    const results: BatchResult[] = [];
    const totalLanguages = targetLanguages.filter((l: string) => l !== 'hu').length;
    let completedLanguages = 0;

    // Broadcast initial progress
    await progressChannel.send({
      type: 'broadcast',
      event: 'progress',
      payload: {
        progress: 0,
        status: 'Fordítás indítása...',
        completed: 0,
        total: items.length,
        currentLang: null
      }
    });

    // Process all items in parallel for each language
    for (const lang of targetLanguages as LangCode[]) {
      if (lang === 'hu') continue; // Skip Hungarian (source language)

      console.log(`[translate-text-batch] Starting batch translation to ${lang}`);

      // Broadcast language start progress
      const currentProgress = Math.floor((completedLanguages / totalLanguages) * 100);
      await progressChannel.send({
        type: 'broadcast',
        event: 'progress',
        payload: {
          progress: currentProgress,
          status: `Fordítás ${LANGUAGE_NAMES[lang]} nyelvre...`,
          completed: completedLanguages,
          total: totalLanguages,
          currentLang: lang
        }
      });

      // Create batch prompt for all items at once
      const batchTexts = items.map((item: TranslationItem, idx: number) => 
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

      const userPrompt = `Translate these ${items.length} Hungarian UI texts to native ${LANGUAGE_NAMES[lang]} with PERFECT grammar (do NOT copy Hungarian text!). Return numbered format:\n\n${batchTexts}`;

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
            max_tokens: 2000
          })
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`[translate-text-batch] AI API error for ${lang}:`, aiResponse.status, errorText);
          
          if (aiResponse.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
            );
          }
          if (aiResponse.status === 402) {
            return new Response(
              JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
            );
          }
          
          // Mark all items as failed for this language
          items.forEach((item: TranslationItem) => {
            const existingResult = results.find(r => r.key === item.key);
            if (existingResult) {
              existingResult.translations[lang] = item.hu;
              existingResult.error = `Translation failed for ${lang}`;
            } else {
              results.push({
                key: item.key,
                translations: { [lang]: item.hu },
                error: `Translation failed for ${lang}`
              });
            }
          });
          continue;
        }

        const aiData = await aiResponse.json();
        const translatedText = aiData.choices?.[0]?.message?.content?.trim() || '';
        
        // Parse numbered translations
        const lines = translatedText.split('\n').filter((line: string) => line.trim());
        
        items.forEach((item: TranslationItem, idx: number) => {
          // Find the line that starts with the number
          const matchingLine = lines.find((line: string) => 
            line.trim().match(new RegExp(`^${idx + 1}\\.\\s*`))
          );

          let translation = item.hu; // Fallback to Hungarian
          
          if (matchingLine) {
            // Remove number prefix and quotes
            translation = matchingLine
              .replace(new RegExp(`^${idx + 1}\\.\\s*`), '')
              .replace(/^["']|["']$/g, '')
              .trim();
          }

          // Find or create result entry for this key
          const existingResult = results.find(r => r.key === item.key);
          if (existingResult) {
            existingResult.translations[lang] = translation;
          } else {
            results.push({
              key: item.key,
              translations: { hu: item.hu, [lang]: translation }
            });
          }
        });

        console.log(`[translate-text-batch] Completed ${lang} - ${items.length} items`);
        completedLanguages++;

        // Broadcast completion for this language
        const updatedProgress = Math.floor((completedLanguages / totalLanguages) * 100);
        await progressChannel.send({
          type: 'broadcast',
          event: 'progress',
          payload: {
            progress: Math.min(updatedProgress, 99),
            status: `${completedLanguages}/${totalLanguages} nyelv kész...`,
            completed: completedLanguages,
            total: totalLanguages,
            currentLang: null
          }
        });

      } catch (translateError) {
        console.error(`[translate-text-batch] Translation error for ${lang}:`, translateError);
        
        // Mark all items as failed for this language
        items.forEach((item: TranslationItem) => {
          const existingResult = results.find(r => r.key === item.key);
          if (existingResult) {
            existingResult.translations[lang] = item.hu;
            existingResult.error = `Translation error for ${lang}`;
          } else {
            results.push({
              key: item.key,
              translations: { [lang]: item.hu },
              error: `Translation error for ${lang}`
            });
          }
        });
      }
    }

    console.log(`[translate-text-batch] Batch complete - ${results.length} results`);

    // Broadcast final progress
    await progressChannel.send({
      type: 'broadcast',
      event: 'progress',
      payload: {
        progress: 100,
        status: 'Fordítás befejezve!',
        completed: totalLanguages,
        total: totalLanguages,
        currentLang: null
      }
    });

    // Unsubscribe from channel
    await supabase.removeChannel(progressChannel);

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[translate-text-batch] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
