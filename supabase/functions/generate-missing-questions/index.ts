import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();
const TARGET_QUESTIONS_PER_TOPIC = 150;
const TARGET_LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'nl', 'pt'];
const MAX_QUESTION_LENGTH = 120;
const MAX_ANSWER_LENGTH = 50;

interface TopicInfo {
  topic_id: number;
  name: string;
  current_count: number;
  needed: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get topic statistics
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('questions')
      .select('topic_id, source_category');

    if (statsError) throw new Error(`Stats error: ${statsError.message}`);

    const topicCounts = new Map<number, number>();
    stats?.forEach(q => {
      topicCounts.set(q.topic_id, (topicCounts.get(q.topic_id) || 0) + 1);
    });

    // Define topics (matching your database)
    const topics: { id: number; name: string; category: string }[] = [
      { id: 1, name: 'Egészség és wellness', category: 'health' },
      { id: 2, name: 'Mentális egészség', category: 'health' },
      { id: 3, name: 'Táplálkozás', category: 'health' },
      { id: 4, name: 'Fitness és sport', category: 'health' },
      { id: 5, name: 'Megelőzés', category: 'health' },
      { id: 6, name: 'Történelem', category: 'history' },
      { id: 7, name: 'Magyar történelem', category: 'history' },
      { id: 8, name: 'Világtörténelem', category: 'history' },
      { id: 9, name: 'Tudománytörténet', category: 'history' },
      { id: 10, name: 'Kultúrtörténet', category: 'history' },
      { id: 11, name: 'Földrajz', category: 'culture' },
      { id: 12, name: 'Irodalom', category: 'culture' },
      { id: 13, name: 'Magyar irodalom', category: 'culture' },
      { id: 14, name: 'Zene', category: 'culture' },
      { id: 15, name: 'Klasszikus zene', category: 'culture' },
      { id: 16, name: 'Művészet', category: 'culture' },
      { id: 17, name: 'Építészet', category: 'culture' },
      { id: 18, name: 'Film és színház', category: 'culture' },
      { id: 19, name: 'Popkultúra', category: 'culture' },
      { id: 20, name: 'Pénzügy', category: 'finance' },
      { id: 21, name: 'Befektetés', category: 'finance' },
      { id: 22, name: 'Vállalkozás', category: 'finance' },
      { id: 23, name: 'Gazdaság', category: 'finance' },
      { id: 24, name: 'Önismeret', category: 'health' },
      { id: 25, name: 'Pszichológia', category: 'health' },
      { id: 26, name: 'Vegyes', category: 'mixed' },
      { id: 27, name: 'Általános műveltség', category: 'mixed' }
    ];

    const topicsNeedingQuestions: TopicInfo[] = [];
    for (const topic of topics) {
      const current = topicCounts.get(topic.id) || 0;
      const needed = TARGET_QUESTIONS_PER_TOPIC - current;
      if (needed > 0) {
        topicsNeedingQuestions.push({
          topic_id: topic.id,
          name: topic.name,
          current_count: current,
          needed
        });
      }
    }

    console.log(`[generate-missing] ${topicsNeedingQuestions.length} topics need questions`);

    const results = {
      success: true,
      topics_processed: 0,
      questions_generated: 0,
      questions_translated: 0,
      errors: [] as string[]
    };

    // Generate questions for each topic
    for (const topicInfo of topicsNeedingQuestions) {
      try {
        console.log(`[generate-missing] Generating ${topicInfo.needed} questions for ${topicInfo.name}`);

        const topic = topics.find(t => t.id === topicInfo.topic_id)!;
        const batchSize = Math.min(20, topicInfo.needed);
        const batches = Math.ceil(topicInfo.needed / batchSize);

        for (let batch = 0; batch < batches; batch++) {
          const questionsInBatch = Math.min(batchSize, topicInfo.needed - (batch * batchSize));
          
          const prompt = `Generálj ${questionsInBatch} db kvízkérdést a következő témában: "${topicInfo.name}".

KRITIKUS SZABÁLYOK:
1. Kérdés max ${MAX_QUESTION_LENGTH} karakter
2. Minden válasz max ${MAX_ANSWER_LENGTH} karakter
3. Pontosan 3 válaszlehetőség (A, B, C)
4. Válaszd ki melyik a helyes (0, 1 vagy 2 index)
5. JSON formátum, magyar nyelv

JSON formátum:
{
  "questions": [
    {
      "question": "Kérdés szövege?",
      "answers": ["Válasz A", "Válasz B", "Válasz C"],
      "correctIndex": 0
    }
  ]
}

Példa jó kérdés: "Melyik évben született Mozart?" - 28 karakter
Példa jó válasz: "1756" - 4 karakter

FONTOS: NE használj hosszú kérdéseket vagy válaszokat!`;

          const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'Te egy kvízkérdés generátor vagy. Rövid, tömör kérdéseket és válaszokat készítesz a karakterszám korlátok betartásával.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.8,
              response_format: { type: 'json_object' }
            })
          });

          if (!aiResponse.ok) {
            throw new Error(`AI API error: ${aiResponse.statusText}`);
          }

          const aiData = await aiResponse.json();
          const content = aiData.choices[0].message.content;
          const parsed = JSON.parse(content);

          // Validate and insert questions
          for (const q of parsed.questions) {
            // Validate lengths
            if (q.question.length > MAX_QUESTION_LENGTH) {
              console.warn(`Question too long: ${q.question.length} chars`);
              continue;
            }
            if (q.answers.some((a: string) => a.length > MAX_ANSWER_LENGTH)) {
              console.warn(`Answer too long in question: ${q.question}`);
              continue;
            }

            const questionId = `gen_${topicInfo.topic_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const answers = [
              { key: 'A', text: q.answers[0], correct: q.correctIndex === 0 },
              { key: 'B', text: q.answers[1], correct: q.correctIndex === 1 },
              { key: 'C', text: q.answers[2], correct: q.correctIndex === 2 }
            ];

            const correctKey = ['A', 'B', 'C'][q.correctIndex];
            const thirdKey = ['A', 'B', 'C'][(q.correctIndex + 1) % 3];
            const audience = {
              A: q.correctIndex === 0 ? 65 : 20,
              B: q.correctIndex === 1 ? 65 : 20,
              C: q.correctIndex === 2 ? 65 : 20
            };

            const { error: insertError } = await supabaseAdmin
              .from('questions')
              .insert({
                id: questionId,
                question: q.question,
                answers: answers,
                correct_answer: correctKey,
                audience: audience,
                third: thirdKey,
                source_category: topic.category,
                topic_id: topicInfo.topic_id
              });

            if (insertError) {
              console.error(`Insert error:`, insertError);
              results.errors.push(`Insert failed for ${topicInfo.name}: ${insertError.message}`);
            } else {
              results.questions_generated++;

              // Translate immediately
              for (const lang of TARGET_LANGUAGES) {
                try {
                  const translatePrompt = `Fordítsd le ${lang} nyelvre. FONTOS: Kérdés max ${MAX_QUESTION_LENGTH}, válaszok max ${MAX_ANSWER_LENGTH} karakter!

Kérdés: ${q.question}
Válaszok: ${q.answers.join(', ')}

JSON: {"question": "...", "answers": ["...", "...", "..."]}`;

                  const translateResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      model: 'gpt-4o-mini',
                      messages: [
                        { role: 'system', content: 'Te fordító vagy. Tömör, rövid fordításokat készítesz.' },
                        { role: 'user', content: translatePrompt }
                      ],
                      temperature: 0.3,
                      response_format: { type: 'json_object' }
                    })
                  });

                  if (translateResponse.ok) {
                    const translateData = await translateResponse.json();
                    const translation = JSON.parse(translateData.choices[0].message.content);

                    await supabaseAdmin
                      .from('question_translations')
                      .insert({
                        question_id: questionId,
                        lang: lang,
                        question_text: translation.question.substring(0, MAX_QUESTION_LENGTH),
                        answer_a: translation.answers[0].substring(0, MAX_ANSWER_LENGTH),
                        answer_b: translation.answers[1].substring(0, MAX_ANSWER_LENGTH),
                        answer_c: translation.answers[2].substring(0, MAX_ANSWER_LENGTH)
                      });

                    results.questions_translated++;
                  }
                } catch (translateError) {
                  console.error(`Translation error for ${lang}:`, translateError);
                }
              }
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        results.topics_processed++;
      } catch (error) {
        console.error(`Error processing topic ${topicInfo.name}:`, error);
        results.errors.push(`Topic ${topicInfo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-missing] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});