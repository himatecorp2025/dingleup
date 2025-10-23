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
    const supabaseAuth = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { userId: requesterUserId } = await req.json();

    // Validate requesterUserId
    if (!requesterUserId || typeof requesterUserId !== 'string') {
      return new Response(JSON.stringify({ error: 'Requester user ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requesterUserId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize user IDs
    const [userA, userB] = user.id < requesterUserId 
      ? [user.id, requesterUserId] 
      : [requesterUserId, user.id];

    // Check if friendship request exists
    const { data: friendship, error: fetchError } = await supabaseClient
      .from('friendships')
      .select('*')
      .eq('user_id_a', userA)
      .eq('user_id_b', userB)
      .single();

    if (fetchError || !friendship) {
      return new Response(JSON.stringify({ error: 'Friend request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify that current user is the receiver (not the requester)
    if (friendship.requested_by === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot accept your own request' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (friendship.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Request is not pending' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update friendship to active
    const { error: updateError } = await supabaseClient
      .from('friendships')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id_a', userA)
      .eq('user_id_b', userB);

    if (updateError) {
      console.error('[INTERNAL] Error updating friendship:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to accept request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create or ensure DM thread exists
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
          user_id_b: userB,
        })
        .select('id')
        .single();

      if (threadError) {
        console.error('[INTERNAL] Error creating thread:', threadError);
      } else {
        threadId = newThread.id;
      }
    }

    // Initialize message reads for both users
    if (threadId) {
      await supabaseClient
        .from('message_reads')
        .upsert([
          { thread_id: threadId, user_id: user.id, last_read_at: new Date().toISOString() },
          { thread_id: threadId, user_id: requesterUserId, last_read_at: new Date().toISOString() }
        ], {
          onConflict: 'thread_id,user_id'
        });

      // Update thread permissions: both users can now send messages
      await supabaseClient
        .from('thread_participants')
        .upsert([
          { thread_id: threadId, user_id: user.id, can_send: true },
          { thread_id: threadId, user_id: requesterUserId, can_send: true }
        ], { onConflict: 'thread_id,user_id' });
    }

    console.log(`Friend request accepted: ${requesterUserId} -> ${user.id}`);

    return new Response(JSON.stringify({ 
      success: true,
      threadId 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[INTERNAL] Error in accept-friend-request:', error);
    return new Response(JSON.stringify({ error: 'A kérés feldolgozása sikertelen' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
