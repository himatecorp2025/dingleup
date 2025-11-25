import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[test-question-translation] Starting test translation...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    // Test with 3 Hungarian questions
    const testQuestions = [
      {
        id: 'test_1',
        question: 'Ki írta a "Carmina Burana" kantátát?',
        answer_a: 'Carl Orff',
        answer_b: 'Richard Strauss', 
        answer_c: 'Gustav Mahler',
        correct: 'A'
      },
      {
        id: 'test_2',
        question: 'Mi a fotoszintézis?',
        answer_a: 'Víz előállítása',
        answer_b: 'Glükóz előállítása fényből',
        answer_c: 'Oxigén felszabadítása',
        correct: 'B'
      },
      {
        id: 'test_3',
        question: 'Melyik évben volt az első ember a Holdon?',
        answer_a: '1969',
        answer_b: '1971',
        answer_c: '1967',
        correct: 'A'
      }
    ];

    const batchTexts = testQuestions.map((item, idx) => {
      return `${idx + 1}. Question: "${item.question}"
   Answer A: "${item.answer_a}"
   Answer B: "${item.answer_b}"
   Answer C: "${item.answer_c}"
   Correct: ${item.correct}`;
    }).join('\n\n');

    const systemPrompt = `You are a professional translator specializing in quiz questions and educational content from Hungarian to English.

CRITICAL RULES:
1. Translate naturally and idiomatically for English-speaking users
2. Maintain quiz question formatting and clarity
3. Keep answer order exactly as provided (A/B/C positions unchanged)
4. The correct answer indicator remains the same letter
5. Use native-speaker fluency and appropriate educational terminology
6. MANDATORY: Every question MUST end with a question mark (?)
7. MANDATORY: Questions MUST be complete sentences, NEVER truncated or cut off
8. MANDATORY: Answers must be complete phrases, NEVER truncated or cut off
9. CRITICAL: Do NOT truncate text at character limits - write full natural translations
10. Questions can be up to 200 characters if needed to be grammatically complete
11. Answers can be up to 100 characters if needed to be complete and natural

GRAMMAR AND LANGUAGE-SPECIFIC RULES (CRITICAL):
- English: Use correct SVO word order (Subject-Verb-Object)
- Use proper article usage (a/an/the)
- Maintain proper tense consistency
- Use natural English phrasing and idioms

RESPONSE FORMAT:
Return ONLY numbered translations in this format for EACH question:
1. Question: "translated question ending with ?"
   A: "complete translated answer A"
   B: "complete translated answer B"
   C: "complete translated answer C"

2. Question: "translated question ending with ?"
   A: "complete translated answer A"
   B: "complete translated answer B"
   C: "complete translated answer C"

NO markdown, NO explanations, NO truncation, ONLY complete translations in the numbered format above.`;

    const userPrompt = `Translate these 3 Hungarian quiz questions to English:

${batchTexts}

CRITICAL REQUIREMENTS:
- Every question MUST end with a question mark (?)
- Questions and answers MUST be complete, NEVER truncated
- Write full natural translations even if they exceed typical length limits
- Keep answer positions (A/B/C) exactly as shown
- Translate naturally for English speakers with proper grammar
- MANDATORY: Follow ALL grammar rules specific to English (capitalization, gender agreement, accent marks, verb conjugations, word order, etc.)
- MANDATORY: Ensure translations sound fluent and natural to native English speakers
- MANDATORY: Respect language-specific grammatical structures and cultural localization`;

    console.log('[test-question-translation] Calling AI with test batch...');
    
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
        max_tokens: 4000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[test-question-translation] AI error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `AI API error: ${aiResponse.status} - ${errorText}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    console.log('[test-question-translation] AI Response:', aiContent);

    return new Response(JSON.stringify({
      success: true,
      testQuestions,
      aiResponse: aiContent,
      message: 'Test translation completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[test-question-translation] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
