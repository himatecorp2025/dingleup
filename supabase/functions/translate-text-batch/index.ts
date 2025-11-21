import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Process all items in parallel for each language
    for (const lang of targetLanguages as LangCode[]) {
      if (lang === 'hu') continue; // Skip Hungarian (source language)

      console.log(`[translate-text-batch] Starting batch translation to ${lang}`);

      // Create batch prompt for all items at once
      const batchTexts = items.map((item: TranslationItem, idx: number) => 
        `${idx + 1}. "${item.hu}"`
      ).join('\n');

      const systemPrompt = `You are a professional translator specializing in UI/UX localization for mobile gaming applications.
Your task is to translate Hungarian text into ${LANGUAGE_NAMES[lang]} while maintaining:
1. Natural, native-speaker fluency
2. Appropriate gaming/app terminology (kvíz=quiz, ranglista=leaderboard, booster=booster, jutalom=reward, arany=gold/coins, élet=life/lives)
3. Consistent tone and style
4. Cultural appropriateness for ${LANGUAGE_NAMES[lang]}-speaking audiences
5. Short, concise UI text for buttons and labels

CRITICAL: Return translations in the EXACT same numbered format as the input. Each line must start with the number followed by the translation.
Do NOT add explanations, notes, or extra formatting. ONLY numbered translations.`;

      const userPrompt = `Translate these ${items.length} Hungarian UI texts to ${LANGUAGE_NAMES[lang]}. Return them in numbered format (1. translation_here):\n\n${batchTexts}`;

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
