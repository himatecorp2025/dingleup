import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Answer {
  key: string;
  text: string;
  correct: boolean;
}

interface Question {
  id: string;
  topic_id: number;
  question: string;
  answers: Answer[];
  correct_answer: string;
}

interface Topic {
  id: number;
  name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Admin jogosultság ellenőrzése
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting question bank validation...');

    // Összes topic lekérdezése
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, name')
      .order('id');

    if (topicsError) throw topicsError;
    console.log(`Loaded ${topics.length} topics`);

    // Összes kérdés lekérdezése
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, topic_id, question, answers, correct_answer');

    if (questionsError) throw questionsError;
    console.log(`Loaded ${questions.length} questions`);

    // 1. Topic-onkénti darabszám ellenőrzése
    const topicCounts = new Map<number, number>();
    questions.forEach(q => {
      const count = topicCounts.get(q.topic_id) || 0;
      topicCounts.set(q.topic_id, count + 1);
    });

    const topicCountReport = topics.map(topic => {
      const count = topicCounts.get(topic.id) || 0;
      const diff = count - 150;
      let status = 'OK';
      if (count < 150) status = 'TOO_FEW';
      if (count > 150) status = 'TOO_MANY';
      
      return {
        topic_id: topic.id,
        topic_name: topic.name,
        question_count: count,
        status,
        diff
      };
    });

    console.log('Topic count analysis complete');

    // 2. Karakterhossz-korlátok ellenőrzése
    const invalidLengthQuestions: any[] = [];
    const invalidCorrectOption: any[] = [];

    questions.forEach(q => {
      const violations: string[] = [];
      
      // Kérdés hossz ellenőrzése (max 75 karakter)
      if (q.question.length > 75) {
        violations.push(`question_text (${q.question.length} chars, max 75)`);
      }

      // Válaszok ellenőrzése
      const answers = q.answers as Answer[];
      if (!Array.isArray(answers) || answers.length !== 3) {
        invalidCorrectOption.push({
          question_id: q.id,
          topic_id: q.topic_id,
          issue: `Not exactly 3 answers (found: ${Array.isArray(answers) ? answers.length : 0})`,
          answer_count: Array.isArray(answers) ? answers.length : 0
        });
      } else {
        // Minden válasz max 50 karakter
        answers.forEach((answer, idx) => {
          if (!answer.text) {
            violations.push(`answer_${idx + 1} (missing text)`);
          } else if (answer.text.length > 50) {
            violations.push(`answer_${idx + 1} (${answer.text.length} chars, max 50)`);
          }
        });

        // Pontosan 1 helyes válasz
        const correctCount = answers.filter(a => a.correct).length;
        if (correctCount !== 1) {
          invalidCorrectOption.push({
            question_id: q.id,
            topic_id: q.topic_id,
            issue: `Incorrect number of correct answers: ${correctCount} (expected 1)`,
            correct_answer: q.correct_answer
          });
        }
      }

      if (violations.length > 0) {
        const topicName = topics.find(t => t.id === q.topic_id)?.name || 'Unknown';
        invalidLengthQuestions.push({
          question_id: q.id,
          topic_id: q.topic_id,
          topic_name: topicName,
          violations,
          question_length: q.question.length
        });
      }
    });

    console.log(`Found ${invalidLengthQuestions.length} length violations`);
    console.log(`Found ${invalidCorrectOption.length} option violations`);

    // 3. Duplikációk felderítése
    const duplicateMap = new Map<string, Question[]>();
    
    questions.forEach(q => {
      const answers = q.answers as Answer[];
      if (!Array.isArray(answers) || answers.length !== 3) return;

      // Kulcs készítése: topic_id + question + válaszok szövegei (rendezett)
      const answerTexts = answers.map(a => a.text || '').sort().join('|||');
      const key = `${q.topic_id}::${q.question}::${answerTexts}`;

      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key)!.push(q);
    });

    const duplicateGroups = Array.from(duplicateMap.entries())
      .filter(([_, questions]) => questions.length > 1)
      .map(([key, questions]) => {
        const firstQ = questions[0];
        const topicName = topics.find(t => t.id === firstQ.topic_id)?.name || 'Unknown';
        return {
          topic_id: firstQ.topic_id,
          topic_name: topicName,
          question_text: firstQ.question,
          duplicate_count: questions.length,
          question_ids: questions.map(q => q.id)
        };
      });

    console.log(`Found ${duplicateGroups.length} duplicate groups`);

    // 4. Összefoglaló riport
    const summary = {
      total_topics: topics.length,
      topics_ok: topicCountReport.filter(t => t.status === 'OK').length,
      topics_too_few: topicCountReport.filter(t => t.status === 'TOO_FEW').length,
      topics_too_many: topicCountReport.filter(t => t.status === 'TOO_MANY').length,
      total_questions: questions.length,
      questions_with_length_violations: invalidLengthQuestions.length,
      questions_with_option_violations: invalidCorrectOption.length,
      duplicate_groups: duplicateGroups.length,
      total_duplicated_questions: duplicateGroups.reduce((sum, g) => sum + g.duplicate_count, 0)
    };

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      topic_counts: topicCountReport,
      invalid_length_questions: invalidLengthQuestions,
      invalid_correct_option: invalidCorrectOption,
      duplicate_groups: duplicateGroups
    };

    console.log('Validation complete:', summary);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
