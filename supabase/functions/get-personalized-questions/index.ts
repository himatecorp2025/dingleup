import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface GetPersonalizedQuestionsRequest {
  numberOfQuestions: number;
}

interface PersonalizedQuestion {
  questionId: string;
  topicId: string;
  topicName: string;
}

interface GetPersonalizedQuestionsResponse {
  userId: string;
  personalized: boolean;
  strategy: {
    totalQuestions: number;
    preferredTopicsCount: number;
    newQuestionsCount: number;
    dislikedTopicsCount: number;
    used70_20_10: boolean;
    totalAnsweredBefore: number;
  };
  questions: PersonalizedQuestion[];
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

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;
    const body: GetPersonalizedQuestionsRequest = await req.json();
    const numberOfQuestions = body.numberOfQuestions || 15;

    // Get total answered count
    const { data: statsData, error: statsError } = await supabaseClient
      .from('user_topic_stats')
      .select('answered_count')
      .eq('user_id', userId);

    const totalAnsweredBefore = statsData?.reduce((sum, s) => sum + s.answered_count, 0) || 0;

    // Get AI settings
    const { data: settings } = await supabaseClient
      .from('user_game_settings')
      .select('ai_personalized_questions_enabled')
      .eq('user_id', userId)
      .single();

    const aiEnabled = settings?.ai_personalized_questions_enabled ?? true;
    const personalized = totalAnsweredBefore >= 1000 && aiEnabled;

    let questions: PersonalizedQuestion[] = [];
    let preferredTopicsCount = 0;
    let newQuestionsCount = 0;
    let dislikedTopicsCount = 0;

    if (!personalized) {
      // General question distribution - random from all 27 topics
      const { data: allQuestions, error: questionsError } = await supabaseClient
        .from('questions')
        .select('id, topic_id, topics(name)')
        .limit(numberOfQuestions * 3);

      if (questionsError) {
        console.error('[get-personalized-questions] Error fetching questions:', questionsError);
        throw questionsError;
      }

      // Shuffle and select
      const shuffled = allQuestions?.sort(() => Math.random() - 0.5) || [];
      questions = shuffled.slice(0, numberOfQuestions).map(q => ({
        questionId: q.id,
        topicId: String(q.topic_id),
        topicName: (q.topics as any)?.name || `Topic ${q.topic_id}`,
      }));
    } else {
      // Personalized 70/20/10 distribution
      preferredTopicsCount = Math.floor(numberOfQuestions * 0.7);
      newQuestionsCount = Math.floor(numberOfQuestions * 0.2);
      dislikedTopicsCount = numberOfQuestions - preferredTopicsCount - newQuestionsCount;

      // Get TOP3 topics by score
      const { data: topTopics, error: topError } = await supabaseClient
        .from('user_topic_stats')
        .select('topic_id')
        .eq('user_id', userId)
        .order('score', { ascending: false })
        .limit(3);

      const topTopicIds = topTopics?.map(t => t.topic_id) || [];

      // Get disliked topics (high dislike count)
      const { data: dislikedTopics, error: dislikeError } = await supabaseClient
        .from('user_topic_stats')
        .select('topic_id')
        .eq('user_id', userId)
        .order('dislike_count', { ascending: false })
        .limit(5);

      const dislikedTopicIds = dislikedTopics?.map(t => t.topic_id) || [];

      // Get seen question IDs
      const { data: seenHistory, error: historyError } = await supabaseClient
        .from('question_seen_history')
        .select('question_id')
        .eq('user_id', userId);

      const seenQuestionIds = new Set(seenHistory?.map(h => h.question_id) || []);

      // 70% - TOP3 topics
      const { data: preferredQuestions } = await supabaseClient
        .from('questions')
        .select('id, topic_id, topics(name)')
        .in('topic_id', topTopicIds)
        .limit(preferredTopicsCount * 2);

      const preferred = (preferredQuestions || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, preferredTopicsCount);

      // 20% - New questions (not seen)
      const { data: allQuestionsForNew } = await supabaseClient
        .from('questions')
        .select('id, topic_id, topics(name)')
        .limit(200);

      const newQs = (allQuestionsForNew || [])
        .filter(q => !seenQuestionIds.has(q.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, newQuestionsCount);

      // 10% - Disliked topics
      const { data: dislikedQuestions } = await supabaseClient
        .from('questions')
        .select('id, topic_id, topics(name)')
        .in('topic_id', dislikedTopicIds)
        .limit(dislikedTopicsCount * 2);

      const disliked = (dislikedQuestions || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, dislikedTopicsCount);

      // Combine and shuffle
      const combined = [...preferred, ...newQs, ...disliked];
      questions = combined
        .sort(() => Math.random() - 0.5)
        .map(q => ({
          questionId: q.id,
          topicId: String(q.topic_id),
          topicName: (q.topics as any)?.name || `Topic ${q.topic_id}`,
        }));

      // Log to seen history
      if (questions.length > 0) {
        const seenRecords = questions.map(q => ({
          user_id: userId,
          question_id: q.questionId,
          seen_at: new Date().toISOString(),
        }));

        await supabaseClient
          .from('question_seen_history')
          .upsert(seenRecords, { onConflict: 'user_id,question_id' });
      }
    }

    const response: GetPersonalizedQuestionsResponse = {
      userId,
      personalized,
      strategy: {
        totalQuestions: numberOfQuestions,
        preferredTopicsCount,
        newQuestionsCount,
        dislikedTopicsCount,
        used70_20_10: personalized,
        totalAnsweredBefore,
      },
      questions,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-personalized-questions] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
