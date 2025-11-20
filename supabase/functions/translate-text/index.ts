import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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
    const { hungarianText, targetLanguages } = await req.json();

    if (!hungarianText || typeof hungarianText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'hungarianText is required and must be a string' }),
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

    console.log('[translate-text] Translating from Hungarian to:', targetLanguages);

    const translations: Record<string, string> = { hu: hungarianText };

    // Translate to each target language using Lovable AI
    for (const lang of targetLanguages as LangCode[]) {
      if (lang === 'hu') continue; // Skip Hungarian (source language)

      const systemPrompt = `You are a professional translator specializing in UI/UX localization for mobile gaming applications. 
Your task is to translate Hungarian text into ${LANGUAGE_NAMES[lang]} while maintaining:
1. Natural, native-speaker fluency
2. Appropriate gaming/app terminology
3. Consistent tone and style
4. Cultural appropriateness for ${LANGUAGE_NAMES[lang]}-speaking audiences

Translate ONLY the text content. Do NOT add explanations, notes, or formatting.`;

      const userPrompt = `Translate this Hungarian text to ${LANGUAGE_NAMES[lang]}:\n\n"${hungarianText}"`;

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
            temperature: 0.3, // Lower temperature for consistent translations
            max_tokens: 500
          })
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`[translate-text] AI API error for ${lang}:`, aiResponse.status, errorText);
          
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
          
          throw new Error(`AI translation failed for ${lang}`);
        }

        const aiData = await aiResponse.json();
        const translatedText = aiData.choices?.[0]?.message?.content?.trim() || hungarianText;
        
        // Remove quotes if AI wrapped the translation
        translations[lang] = translatedText.replace(/^["']|["']$/g, '');
        
        console.log(`[translate-text] ${lang}:`, translations[lang].substring(0, 50) + '...');

      } catch (translateError) {
        console.error(`[translate-text] Translation error for ${lang}:`, translateError);
        translations[lang] = hungarianText; // Fallback to Hungarian
      }
    }

    return new Response(
      JSON.stringify({ translations }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[translate-text] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
