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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Auth verification
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseAuth = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { userId: targetUserId } = await req.json();

    // SECURITY: Comprehensive input validation
    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response(JSON.stringify({ error: 'Target user ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cannot send request to self
    if (user.id === targetUserId) {
      return new Response(JSON.stringify({ error: 'Cannot send friend request to yourself' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limiting (5 minutes between requests to same user)
    const { data: rateLimit } = await supabaseClient
      .from('friend_request_rate_limit')
      .select('last_request_at')
      .eq('user_id', user.id)
      .eq('target_user_id', targetUserId)
      .single();

    if (rateLimit) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (new Date(rateLimit.last_request_at) > fiveMinutesAgo) {
        return new Response(JSON.stringify({ error: 'Please wait 5 minutes between requests' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Normalize user IDs (smaller first)
    const [userA, userB] = user.id < targetUserId 
      ? [user.id, targetUserId] 
      : [targetUserId, user.id];

    // Check if friendship already exists
    const { data: existingFriendship } = await supabaseClient
      .from('friendships')
      .select('*')
      .eq('user_id_a', userA)
      .eq('user_id_b', userB)
      .single();

    if (existingFriendship) {
      if (existingFriendship.status === 'blocked') {
        return new Response(JSON.stringify({ error: 'Cannot send request - user blocked' }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (existingFriendship.status === 'active') {
        return new Response(JSON.stringify({ 
          success: true, 
          status: 'active',
          message: 'Already friends' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (existingFriendship.status === 'pending') {
        return new Response(JSON.stringify({ 
          success: true, 
          status: 'pending',
          message: 'Request already pending' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Create or update friendship request
    const { error: upsertError } = await supabaseClient
      .from('friendships')
      .upsert({
        user_id_a: userA,
        user_id_b: userB,
        status: 'pending',
        requested_by: user.id,
        source: 'invite'
      }, {
        onConflict: 'user_id_a,user_id_b'
      });

    if (upsertError) {
      console.error('Error creating friendship request:', upsertError);
      return new Response(JSON.stringify({ error: 'Failed to create request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create or get thread for this friendship
    const { data: existingThread } = await supabaseClient
      .from('dm_threads')
      .select('id')
      .eq('user_id_a', userA)
      .eq('user_id_b', userB)
      .single();

    let threadId = existingThread?.id;

    if (!threadId) {
      const { data: newThread, error: threadError } = await supabaseClient
        .from('dm_threads')
        .insert({
          user_id_a: userA,
          user_id_b: userB
        })
        .select('id')
        .single();

      if (threadError) {
        console.error('Error creating thread:', threadError);
      } else {
        threadId = newThread.id;
      }
    }

    // Set thread permissions: requester can send, target cannot until accepted
    if (threadId) {
      await supabaseClient
        .from('thread_participants')
        .upsert([
          { thread_id: threadId, user_id: user.id, can_send: true },
          { thread_id: threadId, user_id: targetUserId, can_send: false }
        ], { onConflict: 'thread_id,user_id' });
    }

    // Update rate limit
    await supabaseClient
      .from('friend_request_rate_limit')
      .upsert({
        user_id: user.id,
        target_user_id: targetUserId,
        last_request_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,target_user_id'
      });

    console.log(`Friend request sent from ${user.id} to ${targetUserId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      status: 'pending',
      threadId 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-friend-request:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
