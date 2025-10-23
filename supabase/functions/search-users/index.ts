import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('query') || '';

    if (query.length < 2) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lowerQuery = query.toLowerCase();
    
    // Use trigram-based search with prefix and similarity fallback
    // This provides fast, accent-tolerant, case-insensitive search
    const { data: users, error: searchError } = await supabaseClient.rpc('search_users_by_name', {
      search_query: lowerQuery,
      current_user_id: user.id,
      result_limit: 20
    });

    if (searchError) throw searchError;

    // Get friendship status for each user
    const userIds = users?.map(u => u.id) || [];
    const friendshipChecks = await Promise.all(
      userIds.map(async (targetId) => {
        const [userA, userB] = user.id < targetId ? [user.id, targetId] : [targetId, user.id];
        
        const { data: friendship } = await supabaseClient
          .from('friendships')
          .select('status, requested_by')
          .eq('user_id_a', userA)
          .eq('user_id_b', userB)
          .single();

        let status = 'not_friend';
        if (friendship) {
          if (friendship.status === 'active') {
            status = 'active';
          } else if (friendship.status === 'blocked') {
            status = 'blocked';
          } else if (friendship.status === 'pending') {
            status = friendship.requested_by === user.id ? 'pending_sent' : 'pending_received';
          }
        }

        return { userId: targetId, status };
      })
    );

    const results = users?.map((u, idx) => ({
      ...u,
      friendship_status: friendshipChecks[idx].status
    })) || [];

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
