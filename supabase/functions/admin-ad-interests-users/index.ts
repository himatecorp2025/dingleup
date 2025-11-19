import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdUserInterestRow {
  userIdHash: string;
  topTopics: {
    topicId: string;
    topicName: string;
    interestScore: number;
  }[];
  totalTopicsWithInterest: number;
}

interface AdUserInterestListResponse {
  items: AdUserInterestRow[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Simple hash function for user_id anonymization
function hashUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `User#${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
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

    // Parse query params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);
    const topicIdFilter = url.searchParams.get('topicId');

    console.log(`[Ad Interests Users] Fetching page ${page}, size ${pageSize}, topicFilter: ${topicIdFilter}`);

    // Build query
    let query = supabaseServiceClient
      .from('user_ad_interest_candidates')
      .select('user_id, topic_id, interest_score', { count: 'exact' });

    if (topicIdFilter) {
      query = query.eq('topic_id', parseInt(topicIdFilter, 10));
    }

    const { data: interestData, error: interestError, count } = await query;

    if (interestError) {
      console.error('Error fetching interest data:', interestError);
      throw new Error('Failed to fetch interest data');
    }

    // Group by user
    const userMap = new Map<string, Array<{ topicId: number; score: number }>>();

    for (const row of interestData || []) {
      if (!userMap.has(row.user_id)) {
        userMap.set(row.user_id, []);
      }
      userMap.get(row.user_id)!.push({
        topicId: row.topic_id,
        score: row.interest_score,
      });
    }

    // Get unique topic IDs for fetching names
    const allTopicIds = Array.from(new Set((interestData || []).map(r => r.topic_id)));
    const { data: topics, error: topicsError } = await supabaseServiceClient
      .from('topics')
      .select('id, name')
      .in('id', allTopicIds);

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
      throw new Error('Failed to fetch topics');
    }

    const topicNameMap = new Map(topics?.map(t => [t.id, t.name]) || []);

    // Build user rows
    const allUserIds = Array.from(userMap.keys());
    const totalUsers = allUserIds.length;
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedUserIds = allUserIds.slice(startIdx, endIdx);

    const userRows: AdUserInterestRow[] = [];

    for (const userId of paginatedUserIds) {
      const topicScores = userMap.get(userId) || [];
      
      // Sort by score descending and take top 5
      const topTopics = topicScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(ts => ({
          topicId: ts.topicId.toString(),
          topicName: topicNameMap.get(ts.topicId) || 'Unknown',
          interestScore: Math.round(ts.score * 10000) / 10000,
        }));

      userRows.push({
        userIdHash: hashUserId(userId),
        topTopics,
        totalTopicsWithInterest: topicScores.length,
      });
    }

    const response: AdUserInterestListResponse = {
      items: userRows,
      page,
      pageSize,
      totalItems: totalUsers,
      totalPages: Math.ceil(totalUsers / pageSize),
    };

    console.log(`[Ad Interests Users] Returning ${userRows.length} user rows`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Ad Interests Users] Error:', error);
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