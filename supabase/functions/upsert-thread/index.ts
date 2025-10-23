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

    const authHeader = req.headers.get('Authorization') || '';
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { userId: targetUserId } = await req.json();

    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response(JSON.stringify({ error: 'Target user ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cannot create thread with self
    if (user.id === targetUserId) {
      return new Response(JSON.stringify({ error: 'Cannot create thread with yourself' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if they are friends
    const [userA, userB] = user.id < targetUserId 
      ? [user.id, targetUserId] 
      : [targetUserId, user.id];

    const { data: friendship } = await supabaseClient
      .from('friendships')
      .select('status')
      .eq('user_id_a', userA)
      .eq('user_id_b', userB)
      .single();

    if (!friendship || friendship.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Not friends with this user' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if thread already exists
    const { data: existingThread } = await supabaseClient
      .from('dm_threads')
      .select('id')
      .eq('user_id_a', userA)
      .eq('user_id_b', userB)
      .single();

    if (existingThread) {
      // Ensure message read status and permissions exist for both users (idempotent)
      await supabaseClient
        .from('message_reads')
        .upsert([
          { thread_id: existingThread.id, user_id: user.id, last_read_at: new Date().toISOString() },
          { thread_id: existingThread.id, user_id: targetUserId, last_read_at: new Date().toISOString() }
        ], {
          onConflict: 'thread_id,user_id'
        });

      await supabaseClient
        .from('thread_participants')
        .upsert([
          { thread_id: existingThread.id, user_id: user.id, can_send: true },
          { thread_id: existingThread.id, user_id: targetUserId, can_send: true }
        ], { onConflict: 'thread_id,user_id' });

      console.log(`Thread already exists: ${existingThread.id} (permissions ensured)`);
      return new Response(JSON.stringify({ threadId: existingThread.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Create new thread
    const { data: newThread, error: threadError } = await supabaseClient
      .from('dm_threads')
      .insert({
        user_id_a: userA,
        user_id_b: userB,
      })
      .select('id')
      .single();

    if (threadError || !newThread) {
      console.error('Error creating thread:', threadError);
      return new Response(JSON.stringify({ error: 'Failed to create thread' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize message reads for both users
    await supabaseClient
      .from('message_reads')
      .upsert([
        { thread_id: newThread.id, user_id: user.id, last_read_at: new Date().toISOString() },
        { thread_id: newThread.id, user_id: targetUserId, last_read_at: new Date().toISOString() }
      ], {
        onConflict: 'thread_id,user_id'
      });

    // Ensure both users can send messages immediately
    await supabaseClient
      .from('thread_participants')
      .upsert([
        { thread_id: newThread.id, user_id: user.id, can_send: true },
        { thread_id: newThread.id, user_id: targetUserId, can_send: true }
      ], { onConflict: 'thread_id,user_id' });

    console.log(`New thread created: ${newThread.id} between ${user.id} and ${targetUserId}`);

    return new Response(JSON.stringify({ threadId: newThread.id }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in upsert-thread:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
