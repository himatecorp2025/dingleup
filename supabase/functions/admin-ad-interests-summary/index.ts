import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdInterestTopicSummary {
  topicId: string;
  topicName: string;
  avgInterestScore: number;
  userCount: number;
}

interface AdInterestSummaryResponse {
  topics: AdInterestTopicSummary[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabaseServiceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[Ad Interests Summary] Fetching topic summaries...');

    // Fetch aggregated data by topic
    const { data: aggregatedData, error: aggError } = await supabaseServiceClient
      .from('user_ad_interest_candidates')
      .select(`
        topic_id,
        interest_score
      `);

    if (aggError) {
      console.error('Error fetching aggregated data:', aggError);
      throw new Error('Failed to fetch aggregated data');
    }

    // Group by topic and calculate avg + count
    const topicMap = new Map<number, { scores: number[]; }>();

    for (const row of aggregatedData || []) {
      if (!topicMap.has(row.topic_id)) {
        topicMap.set(row.topic_id, { scores: [] });
      }
      topicMap.get(row.topic_id)!.scores.push(row.interest_score);
    }

    // Fetch topic names
    const topicIds = Array.from(topicMap.keys());
    const { data: topics, error: topicsError } = await supabaseServiceClient
      .from('topics')
      .select('id, name')
      .in('id', topicIds);

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
      throw new Error('Failed to fetch topics');
    }

    // Build response
    const topicSummaries: AdInterestTopicSummary[] = [];

    for (const topic of topics || []) {
      const stats = topicMap.get(topic.id);
      if (!stats) continue;

      const avgScore = stats.scores.reduce((sum, s) => sum + s, 0) / stats.scores.length;

      topicSummaries.push({
        topicId: topic.id.toString(),
        topicName: topic.name,
        avgInterestScore: Math.round(avgScore * 10000) / 10000, // 4 decimals
        userCount: stats.scores.length,
      });
    }

    // Sort by avgInterestScore descending
    topicSummaries.sort((a, b) => b.avgInterestScore - a.avgInterestScore);

    const response: AdInterestSummaryResponse = {
      topics: topicSummaries,
    };

    console.log(`[Ad Interests Summary] Returning ${topicSummaries.length} topic summaries`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Ad Interests Summary] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});