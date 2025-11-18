import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Step 1: Generating 25 topics...');
    
    // Generate 25 diverse topics
    const topicsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'system',
          content: 'Te egy kvíz kérdés témakör generátor vagy. Generálj 25 változatos témakört magyar nyelven, amelyek érdekesek és oktatóak. Adj vissza JSON formátumban: {"topics": [{"name": "Témanév", "description": "Rövid leírás"}]}'
        }, {
          role: 'user',
          content: 'Generálj 25 változatos témakört kvíz kérdésekhez (történelem, tudomány, kultúra, sport, földrajz, művészet, technológia, stb.). Legyen változatos és érdekes!'
        }],
        temperature: 0.8,
      }),
    });

    if (!topicsResponse.ok) {
      const errorText = await topicsResponse.text();
      console.error('Topics generation error:', topicsResponse.status, errorText);
      throw new Error(`Failed to generate topics: ${topicsResponse.status}`);
    }

    const topicsData = await topicsResponse.json();
    const topicsJson = JSON.parse(topicsData.choices[0].message.content);
    const topics = topicsJson.topics.slice(0, 25);

    console.log(`Generated ${topics.length} topics`);

    // Insert topics into database
    const { data: insertedTopics, error: topicsError } = await supabaseClient
      .from('topics')
      .insert(topics)
      .select();

    if (topicsError) {
      console.error('Topics insert error:', topicsError);
      throw topicsError;
    }

    console.log(`Inserted ${insertedTopics.length} topics into database`);

    // Generate questions for each topic (50 per topic)
    let totalQuestions = 0;
    
    for (const topic of insertedTopics) {
      console.log(`Generating 50 questions for topic: ${topic.name}`);
      
      // Generate in batches of 10 questions to avoid timeouts
      for (let batch = 0; batch < 5; batch++) {
        const questionsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{
              role: 'system',
              content: `Te egy kvíz kérdés generátor vagy. Generálj magyar nyelvű kvíz kérdéseket JSON formátumban:
{
  "questions": [
    {
      "question": "Kérdés szövege?",
      "answers": [
        {"key": "A", "text": "Válasz A szövege", "correct": true},
        {"key": "B", "text": "Válasz B szövege", "correct": false},
        {"key": "C", "text": "Válasz C szövege", "correct": false}
      ]
    }
  ]
}

KRITIKUS: Pontosan 1 helyes válasz legyen (correct: true), a másik 2 legyen false!`
            }, {
              role: 'user',
              content: `Generálj 10 kvíz kérdést a következő témakörben: ${topic.name} - ${topic.description}. 
Minden kérdéshez pontosan 3 válaszlehetőség (A, B, C), és PONTOSAN 1 helyes válasz!
A kérdések legyenek változatosak, érdekesek és kihívást jelentők.`
            }],
            temperature: 0.7,
          }),
        });

        if (!questionsResponse.ok) {
          const errorText = await questionsResponse.text();
          console.error(`Questions generation error for ${topic.name}:`, questionsResponse.status, errorText);
          continue;
        }

        const questionsData = await questionsResponse.json();
        let questionsJson;
        try {
          questionsJson = JSON.parse(questionsData.choices[0].message.content);
        } catch (parseError) {
          console.error(`JSON parse error for ${topic.name}:`, parseError);
          continue;
        }

        const questions = questionsJson.questions.map((q: any) => {
          // Generate audience distribution (random but totaling 100)
          const audienceA = Math.floor(Math.random() * 50) + 20;
          const audienceB = Math.floor(Math.random() * (100 - audienceA - 20)) + 10;
          const audienceC = 100 - audienceA - audienceB;

          // Select a random wrong answer for "third" help
          const wrongAnswers = q.answers.filter((a: any) => !a.correct);
          const thirdAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)]?.key || 'B';

          return {
            id: crypto.randomUUID(),
            question: q.question,
            answers: q.answers,
            audience: { A: audienceA, B: audienceB, C: audienceC },
            third: thirdAnswer,
            source_category: 'mixed',
            topic_id: topic.id,
          };
        });

        // Insert questions batch
        const { error: questionsError } = await supabaseClient
          .from('questions')
          .insert(questions);

        if (questionsError) {
          console.error(`Questions insert error for ${topic.name}:`, questionsError);
        } else {
          totalQuestions += questions.length;
          console.log(`Inserted batch ${batch + 1}/5 for ${topic.name} (${questions.length} questions)`);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Total questions generated and inserted: ${totalQuestions}`);

    return new Response(
      JSON.stringify({
        success: true,
        topics: insertedTopics.length,
        questions: totalQuestions,
        message: `Successfully generated ${insertedTopics.length} topics and ${totalQuestions} questions`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
