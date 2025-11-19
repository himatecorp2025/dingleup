import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface AdminUserGameProfileRow {
  userId: string;
  username: string;
  totalAnswered: number;
  overallCorrectRatio: number;
  totalLikes: number;
  totalDislikes: number;
  aiPersonalizedQuestionsEnabled: boolean;
  personalizationActive: boolean;
  topTopics: {
    topicId: string;
    topicName: string;
    score: number;
  }[];
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

    // Check admin role
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Admin access required');
    }

    // Get all users with stats
    const { data: allStats, error: statsError } = await supabaseClient
      .from('user_topic_stats')
      .select('user_id, answered_count, correct_count, like_count, dislike_count, score, topic_id');

    if (statsError) {
      console.error('[admin-game-profiles] Error fetching stats:', statsError);
      throw statsError;
    }

    // Get all topics
    const { data: topics } = await supabaseClient
      .from('topics')
      .select('id, name');

    const topicMap = new Map(topics?.map(t => [t.id, t.name]) || []);

    // Get all user settings
    const { data: allSettings } = await supabaseClient
      .from('user_game_settings')
      .select('user_id, ai_personalized_questions_enabled');

    const settingsMap = new Map(allSettings?.map(s => [s.user_id, s.ai_personalized_questions_enabled]) || []);

    // Get all profiles
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('id, username');

    const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

    // Aggregate by user
    const userStatsMap = new Map<string, {
      totalAnswered: number;
      totalCorrect: number;
      totalLikes: number;
      totalDislikes: number;
      topicScores: { topicId: number; score: number }[];
    }>();

    allStats?.forEach(stat => {
      const existing = userStatsMap.get(stat.user_id) || {
        totalAnswered: 0,
        totalCorrect: 0,
        totalLikes: 0,
        totalDislikes: 0,
        topicScores: [],
      };

      existing.totalAnswered += stat.answered_count;
      existing.totalCorrect += stat.correct_count;
      existing.totalLikes += stat.like_count;
      existing.totalDislikes += stat.dislike_count;
      existing.topicScores.push({ topicId: stat.topic_id, score: Number(stat.score) });

      userStatsMap.set(stat.user_id, existing);
    });

    // Build response
    const result: AdminUserGameProfileRow[] = [];

    userStatsMap.forEach((stats, userId) => {
      const aiEnabled = settingsMap.get(userId) ?? true;
      const personalizationActive = stats.totalAnswered >= 1000 && aiEnabled;

      const topTopics = stats.topicScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(t => ({
          topicId: String(t.topicId),
          topicName: topicMap.get(t.topicId) || `Topic ${t.topicId}`,
          score: t.score,
        }));

      result.push({
        userId,
        username: profileMap.get(userId) || 'Unknown',
        totalAnswered: stats.totalAnswered,
        overallCorrectRatio: stats.totalAnswered > 0 ? stats.totalCorrect / stats.totalAnswered : 0,
        totalLikes: stats.totalLikes,
        totalDislikes: stats.totalDislikes,
        aiPersonalizedQuestionsEnabled: aiEnabled,
        personalizationActive,
        topTopics,
      });
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[admin-game-profiles] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
