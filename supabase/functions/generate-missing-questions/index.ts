import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TopicInfo {
  topic_id: number;
  topic_name: string;
  current_count: number;
  needed: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    // Get topics that need more questions (< 150)
    const topicsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_topics_needing_questions`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!topicsResponse.ok) {
      throw new Error("Failed to fetch topics");
    }

    const topicsNeedingQuestions: TopicInfo[] = await topicsResponse.json();
    console.log("Topics needing questions:", topicsNeedingQuestions);

    const results = [];

    // Generate questions for each topic
    for (const topic of topicsNeedingQuestions) {
      console.log(`Generating ${topic.needed} questions for ${topic.topic_name}...`);

      // Get existing questions for this topic to avoid duplicates
      const existingResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/question_translations?lang=eq.hu&select=question_text,question_id(topic_id)&question_id.topic_id=eq.${topic.topic_id}`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );

      const existingQuestions = await existingResponse.json();
      const existingTexts = existingQuestions.map((q: any) => q.question_text).join("\n- ");

      const systemPrompt = `Te egy kvíz kérdés generátor vagy. Generálj magyar nyelvű kvíz kérdéseket a megadott témakörben.

KRITIKUS SZABÁLYOK:
1. A kérdés szövege MAXIMUM 75 karakter lehet (kötelező!)
2. Minden válasz szövege MAXIMUM 50 karakter lehet (kötelező!)
3. Minden kérdésnek pontosan 3 válaszlehetősége van (A, B, C)
4. Csak EGY válasz lehet helyes
5. A kérdések legyenek érdekesek, változatosak és kihívást jelentők
6. NE ismételd meg a már létező kérdéseket
7. A válaszok legyenek világosak és egyértelműek
8. Kerüld a túl könnyű vagy túl nehéz kérdéseket

Visszaadási formátum (JSON array):
[
  {
    "question": "Kérdés max 75 karakter?",
    "answers": [
      {"key": "A", "text": "Válasz max 50 karakter", "correct": false},
      {"key": "B", "text": "Helyes válasz max 50 kar", "correct": true},
      {"key": "C", "text": "Válasz max 50 karakter", "correct": false}
    ]
  }
]`;

      const userPrompt = `Témakör: ${topic.topic_name}

Generálj ${topic.needed} új, eredeti kérdést ehhez a témához.

Már létező kérdések (NE ismételd meg ezeket):
- ${existingTexts}

Adj vissza ${topic.needed} darab kérdést JSON array formátumban.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`AI error for ${topic.topic_name}:`, errorText);
        results.push({
          topic: topic.topic_name,
          success: false,
          error: `AI generation failed: ${errorText}`,
        });
        continue;
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices[0].message.content;
      
      let generatedQuestions;
      try {
        const parsed = JSON.parse(content);
        generatedQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      } catch (e) {
        console.error(`Failed to parse AI response for ${topic.topic_name}:`, content);
        results.push({
          topic: topic.topic_name,
          success: false,
          error: "Invalid JSON from AI",
        });
        continue;
      }

      // Insert questions into database
      let insertedCount = 0;
      for (const q of generatedQuestions) {
        try {
          // Generate unique question ID
          const sanitizedTopic = topic.topic_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_');
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000);
          const questionId = `${sanitizedTopic}_${timestamp}_${random}`;

          // Find correct answer
          const correctAnswer = q.answers.find((a: any) => a.correct);
          if (!correctAnswer) {
            console.error("No correct answer found:", q);
            continue;
          }

          // Insert into questions table
          const insertQuestionResponse = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
            method: "POST",
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({
              id: questionId,
              question: q.question,
              answers: q.answers,
              topic_id: topic.topic_id,
              source_category: "ai_generated",
              correct_answer: correctAnswer.key,
              audience: { A: 33, B: 33, C: 34 },
              third: q.answers.find((a: any) => !a.correct)?.key || "A",
            }),
          });

          if (!insertQuestionResponse.ok) {
            const errorText = await insertQuestionResponse.text();
            console.error(`Failed to insert question ${questionId}:`, errorText);
            continue;
          }

          // Insert Hungarian translation
          const insertTranslationResponse = await fetch(`${SUPABASE_URL}/rest/v1/question_translations`, {
            method: "POST",
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({
              question_id: questionId,
              lang: "hu",
              question_text: q.question,
              answer_a: q.answers[0].text,
              answer_b: q.answers[1].text,
              answer_c: q.answers[2].text,
            }),
          });

          if (!insertTranslationResponse.ok) {
            const errorText = await insertTranslationResponse.text();
            console.error(`Failed to insert translation for ${questionId}:`, errorText);
            continue;
          }

          insertedCount++;
        } catch (error) {
          console.error("Error inserting question:", error);
        }
      }

      results.push({
        topic: topic.topic_name,
        success: true,
        needed: topic.needed,
        generated: generatedQuestions.length,
        inserted: insertedCount,
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
