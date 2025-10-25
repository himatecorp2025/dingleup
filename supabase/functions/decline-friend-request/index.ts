import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

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

    // Verify that current user is the receiver
    if (friendship.requested_by === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot decline your own request' }), {
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

    // Update friendship to declined
    const { error: updateError } = await supabaseClient
      .from('friendships')
      .update({ 
        status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('user_id_a', userA)
      .eq('user_id_b', userB);

    if (updateError) {
      console.error('[INTERNAL] Error updating friendship:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to decline request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update thread permissions: neither can send after decline
    const { data: thread } = await supabaseClient
      .from('dm_threads')
      .select('id')
      .eq('user_id_a', userA)
      .eq('user_id_b', userB)
      .single();

    if (thread) {
      await supabaseClient
        .from('thread_participants')
        .upsert([
          { thread_id: thread.id, user_id: user.id, can_send: false },
          { thread_id: thread.id, user_id: requesterUserId, can_send: false }
        ], { onConflict: 'thread_id,user_id' });
    }

    console.log(`Friend request declined: ${requesterUserId} -> ${user.id}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[INTERNAL] Error in decline-friend-request:', error);
    return new Response(JSON.stringify({ error: 'A kérés feldolgozása sikertelen' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
