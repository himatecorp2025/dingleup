import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateQuestionsRequest {
  topic_id: number;
  topic_name: string;
  count: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      return new Response(
        JSON.stringify({ error: 'Admin role required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const body: GenerateQuestionsRequest = await req.json();
    const { topic_id, topic_name, count } = body;

    console.log(`Generating ${count} questions for topic ${topic_id}: ${topic_name}`);

    // Get existing questions for this topic as examples
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('question, answers')
      .eq('topic_id', topic_id)
      .limit(3);

    const examplesText = existingQuestions?.map(q => 
      `Kérdés: ${q.question}\nVálaszok: ${q.answers.map((a: any) => `${a.key}) ${a.text}${a.correct ? ' (helyes)' : ''}`).join(', ')}`
    ).join('\n\n') || '';

    // Generate questions using Lovable AI (google/gemini-2.5-flash)
    const prompt = `Generálj ${count} db kvíz kérdést a következő témakörben: ${topic_name}

FONTOS követelmények:
- Minden kérdésnek pontosan 3 válaszlehetősége legyen (A, B, C)
- Pontosan 1 helyes válasz legyen
- A kérdések legyenek változatosak, érdekesek és megfelelő nehézségűek
- Magyar nyelven
- Ne ismételd meg a már létező kérdéseket

${examplesText ? `Példák a létező kérdésekből:\n${examplesText}\n` : ''}

Válaszolj JSON formátumban, egy "questions" tömbbel, ahol minden elem:
{
  "question": "A kérdés szövege?",
  "answers": [
    {"key": "A", "text": "Első válasz", "correct": true},
    {"key": "B", "text": "Második válasz", "correct": false},
    {"key": "C", "text": "Harmadik válasz", "correct": false}
  ]
}`;

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'HTTP-Referer': supabaseUrl,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI generation failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse JSON response
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    const generatedQuestions = parsed.questions;

    // Get highest question ID for this topic
    const { data: maxIdData } = await supabase
      .from('questions')
      .select('id')
      .eq('topic_id', topic_id)
      .order('id', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (maxIdData && maxIdData.length > 0) {
      const lastId = maxIdData[0].id;
      const match = lastId.match(/_(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Prepare questions for insertion
    const topicPrefix = topic_name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_')
      .substring(0, 10);

    const questionsToInsert = generatedQuestions.map((q: any, index: number) => {
      const questionId = `q_${topicPrefix}_${String(nextNumber + index).padStart(3, '0')}`;
      
      // Find correct answer key
      const correctAnswer = q.answers.find((a: any) => a.correct)?.key || 'A';
      
      // Generate audience percentages (favor correct answer)
      const audience = [0, 0, 0, 0];
      const correctIndex = q.answers.findIndex((a: any) => a.correct);
      audience[correctIndex] = 60 + Math.floor(Math.random() * 20);
      const remaining = 100 - audience[correctIndex];
      const wrongIndices = [0, 1, 2].filter(i => i !== correctIndex);
      audience[wrongIndices[0]] = Math.floor(remaining * (0.3 + Math.random() * 0.4));
      audience[wrongIndices[1]] = remaining - audience[wrongIndices[0]];
      audience[3] = Math.floor(Math.random() * 10); // Unsure percentage

      return {
        id: questionId,
        question: q.question,
        answers: q.answers.map((a: any) => ({
          key: a.key,
          text: a.text,
          correct: a.correct
        })),
        audience: audience,
        third: correctAnswer,
        correct_answer: correctAnswer,
        topic_id: topic_id,
        source_category: topicPrefix,
      };
    });

    // Insert questions
    const { data: insertedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select('id');

    if (insertError) {
      throw new Error(`Failed to insert questions: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        topic_id,
        topic_name,
        generated_count: insertedQuestions?.length || 0,
        question_ids: insertedQuestions?.map(q => q.id) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
