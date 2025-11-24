import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LongAnswer {
  id: string;
  question_id: string;
  lang: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  question_text: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all answers longer than 61 characters
    const { data: longAnswers, error: fetchError } = await supabase
      .from('question_translations')
      .select('id, question_id, lang, question_text, answer_a, answer_b, answer_c')
      .or('length(answer_a).gt.61,length(answer_b).gt.61,length(answer_c).gt.61');

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    console.log(`Found ${longAnswers?.length || 0} entries with long answers`);

    if (!longAnswers || longAnswers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No long answers to shorten', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group by language for batch processing
    const byLang: Record<string, LongAnswer[]> = {};
    longAnswers.forEach((item: LongAnswer) => {
      if (!byLang[item.lang]) byLang[item.lang] = [];
      byLang[item.lang].push(item);
    });

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    // Process each language separately
    for (const [lang, items] of Object.entries(byLang)) {
      console.log(`Processing ${items.length} entries for language: ${lang}`);

      // Process in batches of 20
      const batchSize = 20;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        // Prepare prompt for AI
        const promptItems = batch.map((item, idx) => {
          const parts: string[] = [];
          if (item.answer_a.length > 61) parts.push(`${idx}_A: "${item.answer_a}"`);
          if (item.answer_b.length > 61) parts.push(`${idx}_B: "${item.answer_b}"`);
          if (item.answer_c.length > 61) parts.push(`${idx}_C: "${item.answer_c}"`);
          return parts.join('\n');
        }).join('\n\n');

        const systemPrompt = `You are a translation expert. Shorten quiz answers to maximum 61 characters while preserving meaning. Keep the language (${lang}) consistent.

Rules:
- Maximum 61 characters per answer
- Preserve key information
- Use abbreviations when needed
- Keep scientific/technical accuracy
- No explanations, only shortened text

Return ONLY valid JSON array format:
[{"index": 0, "field": "A", "shortened": "text"}, ...]`;

        const userPrompt = `Shorten these answers to max 61 characters:\n\n${promptItems}`;

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
              temperature: 0.3,
            }),
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`AI API error (${lang}, batch ${i}): ${aiResponse.status} - ${errorText}`);
            totalErrors += batch.length;
            continue;
          }

          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          // Extract JSON from markdown if needed
          let jsonStr = content;
          const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }

          const shortenedData = JSON.parse(jsonStr);

          // Apply updates
          for (const update of shortenedData) {
            const item = batch[update.index];
            if (!item) continue;

            const updateData: any = {};
            if (update.field === 'A') updateData.answer_a = update.shortened;
            if (update.field === 'B') updateData.answer_b = update.shortened;
            if (update.field === 'C') updateData.answer_c = update.shortened;

            const { error: updateError } = await supabase
              .from('question_translations')
              .update(updateData)
              .eq('id', item.id);

            if (updateError) {
              console.error(`Update error for ${item.id}:`, updateError);
              totalErrors++;
            } else {
              totalSuccess++;
            }
          }

          totalProcessed += batch.length;
          console.log(`Processed batch ${i}-${i + batch.length} for ${lang}`);

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`Error processing batch ${i} for ${lang}:`, error);
          totalErrors += batch.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed,
        totalSuccess,
        totalErrors,
        message: `Shortened ${totalSuccess} answers successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
