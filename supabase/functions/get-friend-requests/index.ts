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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get pending requests where user is the receiver (not the requester)
    const { data: receivedRequests, error: receivedError } = await supabaseClient
      .from('friendships')
      .select(`
        id,
        requested_by,
        created_at,
        requester:profiles!friendships_requested_by_fkey(
          id,
          username,
          avatar_url
        )
      `)
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .eq('status', 'pending')
      .neq('requested_by', user.id);

    if (receivedError) {
      console.error('Error fetching received requests:', receivedError);
      return new Response(JSON.stringify({ error: 'Failed to fetch requests' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get pending requests sent by user
    const { data: sentRequests, error: sentError } = await supabaseClient
      .from('friendships')
      .select(`
        id,
        user_id_a,
        user_id_b,
        created_at
      `)
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .eq('status', 'pending')
      .eq('requested_by', user.id);

    if (sentError) {
      console.error('Error fetching sent requests:', sentError);
    }

    // Get profiles for sent requests
    const sentRequestsWithProfiles = await Promise.all(
      (sentRequests || []).map(async (req) => {
        const targetUserId = req.user_id_a === user.id ? req.user_id_b : req.user_id_a;
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', targetUserId)
          .single();
        
        return {
          id: req.id,
          target_user: profile,
          created_at: req.created_at
        };
      })
    );

    return new Response(JSON.stringify({ 
      received: receivedRequests || [],
      sent: sentRequestsWithProfiles || []
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-friend-requests:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
