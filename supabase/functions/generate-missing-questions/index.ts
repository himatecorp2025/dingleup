import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TopicInfo {
  topic_id: number;
  topic_name: string;
  needed: number;
}

const TOPIC_NAMES: Record<number, string> = {
  1: "Egészség és táplálkozás",
  2: "Természettudomány",
  3: "Történelem",
  4: "Földrajz",
  5: "Kultúra és művészet",
  6: "Sport",
  7: "Tudomány és technológia",
  8: "Zene",
  9: "Film és színház",
  10: "Irodalom",
  11: "Politika",
  12: "Gazdaság és pénzügy",
  13: "Jog",
  14: "Környezetvédelem",
  15: "Autók és járművek",
  16: "Állatok",
  17: "Növények",
  18: "Vallás és filozófia",
  19: "Pszichológia",
  20: "Szociológia",
  21: "Kémia",
  22: "Fizika",
  23: "Matematika",
  24: "Informatika",
  25: "Építészet",
  26: "Gasztronómia",
  27: "Divat és stílus",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get topic counts and calculate what's needed
    const { data: topicCounts, error: countError } = await supabase
      .from("questions")
      .select("topic_id");

    if (countError) throw countError;

    const countsByTopic = new Map<number, number>();
    topicCounts.forEach((q: any) => {
      const count = countsByTopic.get(q.topic_id) || 0;
      countsByTopic.set(q.topic_id, count + 1);
    });

    const topicsToGenerate: TopicInfo[] = [];
    for (let topicId = 1; topicId <= 27; topicId++) {
      const current = countsByTopic.get(topicId) || 0;
      const needed = 100 - current;
      if (needed > 0) {
        topicsToGenerate.push({
          topic_id: topicId,
          topic_name: TOPIC_NAMES[topicId],
          needed,
        });
      }
    }

    console.log(`Need to generate questions for ${topicsToGenerate.length} topics`);

    let totalGenerated = 0;

    // Process each topic
    for (const topic of topicsToGenerate) {
      console.log(`Generating ${topic.needed} questions for Topic ${topic.topic_id}: ${topic.topic_name}`);

      // Generate in batches of 10
      const batchSize = 10;
      const numBatches = Math.ceil(topic.needed / batchSize);

      for (let batch = 0; batch < numBatches; batch++) {
        const questionsInBatch = Math.min(batchSize, topic.needed - batch * batchSize);

        const prompt = `Készíts ${questionsInBatch} darab magyar nyelvű kvízkérdést a következő témakörben: ${topic.topic_name}.

KRITIKUS SZABÁLYOK:
1. Kérdés maximum 75 karakter (beleértve szóközöket)
2. Minden válasz maximum 50 karakter (beleértve szóközöket)
3. 3 válaszlehetőség: A, B, C
4. Pontosan egy helyes válasz
5. Válaszok legyenek tömörek, világosak

Válaszolj JSON formátumban:
{
  "questions": [
    {
      "question": "Kérdés szövege (max 75 kar)",
      "answers": [
        {"key": "A", "text": "Válasz A (max 50 kar)", "correct": true},
        {"key": "B", "text": "Válasz B (max 50 kar)", "correct": false},
        {"key": "C", "text": "Válasz C (max 50 kar)", "correct": false}
      ]
    }
  ]
}`;

        try {
          const response = await fetch("https://api.lovable.app/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: "Te egy precíz kvízkérdés generátor vagy. Mindig tartsd be a karakterlimiteket.",
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.8,
              max_tokens: 2000,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`AI API error: ${response.status} - ${errorText}`);
            continue;
          }

          const aiData = await response.json();
          const content = aiData.choices?.[0]?.message?.content;

          if (!content) {
            console.error("No content in AI response");
            continue;
          }

          // Parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.error("Could not find JSON in response");
            continue;
          }

          const parsed = JSON.parse(jsonMatch[0]);
          const questions = parsed.questions || [];

          // Insert into database
          for (const q of questions) {
            // Validate lengths
            if (q.question.length > 75) {
              console.warn(`Question too long (${q.question.length}): ${q.question.substring(0, 50)}...`);
              continue;
            }

            let hasInvalidAnswer = false;
            for (const ans of q.answers) {
              if (ans.text.length > 50) {
                console.warn(`Answer too long (${ans.text.length}): ${ans.text}`);
                hasInvalidAnswer = true;
                break;
              }
            }

            if (hasInvalidAnswer) continue;

            const correctAnswer = q.answers.find((a: any) => a.correct)?.key || "A";
            const questionId = `gen_t${topic.topic_id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            // Insert into questions table
            const { error: insertError } = await supabase.from("questions").insert({
              id: questionId,
              topic_id: topic.topic_id,
              question: q.question,
              answers: q.answers,
              correct_answer: correctAnswer,
              source_category: topic.topic_name.toLowerCase(),
              audience: { A: 33, B: 33, C: 34 },
              third: correctAnswer,
              like_count: 0,
              dislike_count: 0,
            });

            if (insertError) {
              console.error(`Failed to insert question: ${insertError.message}`);
              continue;
            }

            // Insert Hungarian translation
            const { error: translationError } = await supabase.from("question_translations").insert({
              question_id: questionId,
              lang: "hu",
              question_text: q.question,
              answer_a: q.answers[0].text,
              answer_b: q.answers[1].text,
              answer_c: q.answers[2].text,
            });

            if (translationError) {
              console.error(`Failed to insert translation: ${translationError.message}`);
            } else {
              totalGenerated++;
            }
          }

          console.log(`Batch ${batch + 1}/${numBatches} for Topic ${topic.topic_id} completed`);
        } catch (err) {
          console.error(`Error generating batch ${batch + 1} for Topic ${topic.topic_id}:`, err);
        }

        // Small delay between batches to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        generated: totalGenerated,
        topics: topicsToGenerate.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
