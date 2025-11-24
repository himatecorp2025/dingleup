import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();
const TARGET_QUESTIONS_PER_TOPIC = 150;
const MAX_QUESTION_LENGTH = 75;
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

    // Fetch topics from database to ensure correct IDs and names
    const { data: topicsData, error: topicsError } = await supabaseAdmin
      .from('topics')
      .select('id, name, category')
      .order('id');
    
    if (topicsError) throw new Error(`Topics fetch error: ${topicsError.message}`);
    
    const topics = topicsData || [];

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
      errors: [] as string[],
      message: ''
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

          const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
          if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
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
              continue; // Skip translation if question insert failed
            }
            
            results.questions_generated++;
            
            // CRITICAL: Immediately translate the question to all languages
            console.log(`[generate-missing] Translating question ${questionId} to all languages...`);
            
            try {
              // Prepare translation batch prompt
              const translationPrompt = `Translate this Hungarian quiz question and answers to these languages: English, German, French, Spanish, Italian, Portuguese, Dutch.

Question: "${q.question}"
Answer A: "${q.answers[0]}"
Answer B: "${q.answers[1]}"
Answer C: "${q.answers[2]}"

Return JSON format ONLY:
{
  "en": { "question": "...", "answers": ["...", "...", "..."] },
  "de": { "question": "...", "answers": ["...", "...", "..."] },
  "fr": { "question": "...", "answers": ["...", "...", "..."] },
  "es": { "question": "...", "answers": ["...", "...", "..."] },
  "it": { "question": "...", "answers": ["...", "...", "..."] },
  "pt": { "question": "...", "answers": ["...", "...", "..."] },
  "nl": { "question": "...", "answers": ["...", "...", "..."] }
}

RULES: Max ${MAX_QUESTION_LENGTH} chars for question, max ${MAX_ANSWER_LENGTH} chars per answer.`;

              const transResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${lovableApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'google/gemini-2.5-flash',
                  messages: [
                    { role: 'system', content: 'You are a professional translator. Return only valid JSON.' },
                    { role: 'user', content: translationPrompt }
                  ],
                  temperature: 0.3,
                  response_format: { type: 'json_object' }
                })
              });

              if (transResponse.ok) {
                const transData = await transResponse.json();
                const translations = JSON.parse(transData.choices[0].message.content);
                
                // Insert translations for all languages
                const langs = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];
                for (const lang of langs) {
                  if (translations[lang]) {
                    await supabaseAdmin.from('question_translations').insert({
                      question_id: questionId,
                      lang: lang,
                      question_text: translations[lang].question,
                      answer_a: translations[lang].answers[0],
                      answer_b: translations[lang].answers[1],
                      answer_c: translations[lang].answers[2]
                    });
                  }
                }
                
                // Also insert Hungarian source
                await supabaseAdmin.from('question_translations').insert({
                  question_id: questionId,
                  lang: 'hu',
                  question_text: q.question,
                  answer_a: q.answers[0],
                  answer_b: q.answers[1],
                  answer_c: q.answers[2]
                });
              } else {
                console.error(`Translation failed for ${questionId}`);
              }
            } catch (transError) {
              console.error(`Translation error for ${questionId}:`, transError);
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        results.topics_processed++;
      } catch (error) {
        console.error(`Error processing topic ${topicInfo.name}:`, error);
        results.errors.push(`Topic ${topicInfo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    results.message = results.questions_generated > 0 
      ? `${results.questions_generated} kérdés generálva és lefordítva minden nyelvre!`
      : 'Nincs hiányzó kérdés.';

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