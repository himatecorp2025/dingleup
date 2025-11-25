import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface TopicCountResult {
  topic_id: string;
  topic_name: string;
  question_count: number;
  status: 'OK' | 'TOO_FEW' | 'TOO_MANY';
  diff: number;
}

interface InvalidLengthQuestion {
  question_id: string;
  topic_id: string;
  topic_name: string;
  field: string;
  length: number;
  limit: number;
}

interface InvalidCorrectOption {
  question_id: string;
  topic_id: string;
  topic_name: string;
  correct_option_index: number;
  issue: string;
}

interface DuplicateGroup {
  topic_id: string;
  topic_name: string;
  question_text: string;
  option_1: string;
  option_2: string;
  option_3: string;
  count: number;
  question_ids: string[];
}

interface ValidationReport {
  summary: {
    totalTopics: number;
    topicsOk: number;
    topicsTooFew: number;
    topicsTooMany: number;
    invalidLengthQuestions: number;
    invalidCorrectOption: number;
    duplicateGroups: number;
    totalDuplicateQuestions: number;
  };
  topicCounts: TopicCountResult[];
  invalidLengthQuestions: InvalidLengthQuestion[];
  invalidCorrectOption: InvalidCorrectOption[];
  duplicates: DuplicateGroup[];
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Nincs bejelentkezve' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        }
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !userRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[validate-question-bank] Starting validation for admin user:', user.id);

    // Initialize report
    const report: ValidationReport = {
      summary: {
        totalTopics: 0,
        topicsOk: 0,
        topicsTooFew: 0,
        topicsTooMany: 0,
        invalidLengthQuestions: 0,
        invalidCorrectOption: 0,
        duplicateGroups: 0,
        totalDuplicateQuestions: 0
      },
      topicCounts: [],
      invalidLengthQuestions: [],
      invalidCorrectOption: [],
      duplicates: []
    };

    // 1) TOPIC-ONKÉNTI DARABSZÁM ELLENŐRZÉSE
    console.log('[validate-question-bank] Step 1: Checking question counts per topic...');

    const { data: topics, error: topicsError } = await supabaseClient
      .from('topics')
      .select('id, name')
      .order('name');

    if (topicsError) {
      console.error('[validate-question-bank] Error fetching topics:', topicsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch topics' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    report.summary.totalTopics = topics?.length || 0;

    // Get question counts per topic
    const { data: questionCounts, error: countsError } = await supabaseClient
      .from('questions')
      .select('topic_id');

    if (countsError) {
      console.error('[validate-question-bank] Error fetching question counts:', countsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch question counts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count questions per topic
    const countMap = new Map<string, number>();
    questionCounts?.forEach(q => {
      countMap.set(q.topic_id, (countMap.get(q.topic_id) || 0) + 1);
    });

    topics?.forEach(topic => {
      const count = countMap.get(topic.id) || 0;
      const diff = count - 150;
      let status: 'OK' | 'TOO_FEW' | 'TOO_MANY' = 'OK';
      
      if (count < 150) {
        status = 'TOO_FEW';
        report.summary.topicsTooFew++;
      } else if (count > 150) {
        status = 'TOO_MANY';
        report.summary.topicsTooMany++;
      } else {
        report.summary.topicsOk++;
      }

      report.topicCounts.push({
        topic_id: topic.id,
        topic_name: topic.name,
        question_count: count,
        status,
        diff
      });
    });

    console.log(`[validate-question-bank] Topics OK: ${report.summary.topicsOk}, Too Few: ${report.summary.topicsTooFew}, Too Many: ${report.summary.topicsTooMany}`);

    // 2) KARAKTERHOSSZ-KORLÁTOK ELLENŐRZÉSE
    console.log('[validate-question-bank] Step 2: Checking character length limits...');

    const { data: allQuestions, error: questionsError } = await supabaseClient
      .from('questions')
      .select('id, topic_id, question_text, option_1, option_2, option_3, correct_option_index');

    if (questionsError) {
      console.error('[validate-question-bank] Error fetching questions:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create topic name map for quick lookup
    const topicNameMap = new Map<string, string>();
    topics?.forEach(t => topicNameMap.set(t.id, t.name));

    allQuestions?.forEach(q => {
      const topicName = topicNameMap.get(q.topic_id) || 'Unknown';

      // Check question text length
      if (q.question_text && q.question_text.length > 75) {
        report.invalidLengthQuestions.push({
          question_id: q.id,
          topic_id: q.topic_id,
          topic_name: topicName,
          field: 'question_text',
          length: q.question_text.length,
          limit: 75
        });
      }

      // Check option_1 length
      if (q.option_1 && q.option_1.length > 50) {
        report.invalidLengthQuestions.push({
          question_id: q.id,
          topic_id: q.topic_id,
          topic_name: topicName,
          field: 'option_1',
          length: q.option_1.length,
          limit: 50
        });
      }

      // Check option_2 length
      if (q.option_2 && q.option_2.length > 50) {
        report.invalidLengthQuestions.push({
          question_id: q.id,
          topic_id: q.topic_id,
          topic_name: topicName,
          field: 'option_2',
          length: q.option_2.length,
          limit: 50
        });
      }

      // Check option_3 length
      if (q.option_3 && q.option_3.length > 50) {
        report.invalidLengthQuestions.push({
          question_id: q.id,
          topic_id: q.topic_id,
          topic_name: topicName,
          field: 'option_3',
          length: q.option_3.length,
          limit: 50
        });
      }

      // Check correct_option_index validity
      if (!q.correct_option_index || q.correct_option_index < 1 || q.correct_option_index > 3) {
        report.invalidCorrectOption.push({
          question_id: q.id,
          topic_id: q.topic_id,
          topic_name: topicName,
          correct_option_index: q.correct_option_index,
          issue: 'correct_option_index not in range 1-3'
        });
      }

      // Check if any option is missing
      if (!q.option_1 || !q.option_2 || !q.option_3) {
        report.invalidCorrectOption.push({
          question_id: q.id,
          topic_id: q.topic_id,
          topic_name: topicName,
          correct_option_index: q.correct_option_index,
          issue: 'missing one or more options'
        });
      }
    });

    report.summary.invalidLengthQuestions = report.invalidLengthQuestions.length;
    report.summary.invalidCorrectOption = report.invalidCorrectOption.length;

    console.log(`[validate-question-bank] Invalid length: ${report.summary.invalidLengthQuestions}, Invalid correct option: ${report.summary.invalidCorrectOption}`);

    // 3) DUPLIKÁCIÓK FELDERÍTÉSE
    console.log('[validate-question-bank] Step 3: Detecting duplicates...');

    // Group questions by topic_id + question_text + options
    const questionGroups = new Map<string, any[]>();
    
    allQuestions?.forEach(q => {
      const key = `${q.topic_id}|||${q.question_text}|||${q.option_1}|||${q.option_2}|||${q.option_3}`;
      if (!questionGroups.has(key)) {
        questionGroups.set(key, []);
      }
      questionGroups.get(key)!.push(q);
    });

    // Find groups with more than 1 question (duplicates)
    questionGroups.forEach((questions, key) => {
      if (questions.length > 1) {
        const firstQ = questions[0];
        const topicName = topicNameMap.get(firstQ.topic_id) || 'Unknown';
        
        report.duplicates.push({
          topic_id: firstQ.topic_id,
          topic_name: topicName,
          question_text: firstQ.question_text,
          option_1: firstQ.option_1,
          option_2: firstQ.option_2,
          option_3: firstQ.option_3,
          count: questions.length,
          question_ids: questions.map(q => q.id)
        });

        report.summary.totalDuplicateQuestions += questions.length;
      }
    });

    report.summary.duplicateGroups = report.duplicates.length;

    console.log(`[validate-question-bank] Duplicate groups: ${report.summary.duplicateGroups}, Total duplicate questions: ${report.summary.totalDuplicateQuestions}`);

    // 4) ÖSSZEFOGLALÓ RIPORT
    console.log('[validate-question-bank] ===== VALIDATION REPORT =====');
    console.log('[validate-question-bank] Total Topics:', report.summary.totalTopics);
    console.log('[validate-question-bank] Topics OK (150 questions):', report.summary.topicsOk);
    console.log('[validate-question-bank] Topics with TOO FEW questions:', report.summary.topicsTooFew);
    console.log('[validate-question-bank] Topics with TOO MANY questions:', report.summary.topicsTooMany);
    console.log('[validate-question-bank] Questions violating length limits:', report.summary.invalidLengthQuestions);
    console.log('[validate-question-bank] Questions with invalid correct_option_index:', report.summary.invalidCorrectOption);
    console.log('[validate-question-bank] Duplicate groups found:', report.summary.duplicateGroups);
    console.log('[validate-question-bank] Total duplicate questions:', report.summary.totalDuplicateQuestions);
    console.log('[validate-question-bank] ==============================');

    return new Response(
      JSON.stringify(report),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[validate-question-bank] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
