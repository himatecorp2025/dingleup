import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { addresseeUserId } = await req.json();

    if (!addresseeUserId) {
      return new Response(JSON.stringify({ error: 'addresseeUserId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(addresseeUserId)) {
      return new Response(JSON.stringify({ error: 'Invalid UUID format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize user IDs (alphabetical order)
    const normalized = [user.id, addresseeUserId].sort();

    // Verify the current user is the requester
    const { data: friendship } = await supabaseAdmin
      .from('friendships')
      .select('requested_by, status')
      .eq('user_id_a', normalized[0])
      .eq('user_id_b', normalized[1])
      .single();

    if (!friendship) {
      return new Response(JSON.stringify({ error: 'Friend request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (friendship.requested_by !== user.id) {
      return new Response(JSON.stringify({ error: 'You are not the requester' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (friendship.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Request is not pending' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update status to canceled
    const { error: updateError } = await supabaseAdmin
      .from('friendships')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id_a', normalized[0])
      .eq('user_id_b', normalized[1])
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error canceling friendship:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to cancel friend request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update thread permissions: neither can send
    const { data: thread } = await supabaseAdmin
      .from('dm_threads')
      .select('id')
      .eq('user_id_a', normalized[0])
      .eq('user_id_b', normalized[1])
      .single();

    if (thread) {
      await supabaseAdmin
        .from('thread_participants')
        .upsert([
          { thread_id: thread.id, user_id: user.id, can_send: false },
          { thread_id: thread.id, user_id: addresseeUserId, can_send: false }
        ], { onConflict: 'thread_id,user_id' });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});