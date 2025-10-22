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

    const { userId: targetUserId, action } = await req.json();

    if (!targetUserId || !action) {
      return new Response(JSON.stringify({ error: 'Target user ID and action required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['block', 'unblock'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize user IDs
    const [userA, userB] = user.id < targetUserId 
      ? [user.id, targetUserId] 
      : [targetUserId, user.id];

    const newStatus = action === 'block' ? 'blocked' : 'active';

    // Update or create friendship with blocked status
    const { error: upsertError } = await supabaseClient
      .from('friendships')
      .upsert({
        user_id_a: userA,
        user_id_b: userB,
        status: newStatus,
        requested_by: user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id_a,user_id_b'
      });

    if (upsertError) {
      console.error('Error updating friendship status:', upsertError);
      return new Response(JSON.stringify({ error: 'Failed to update status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User ${user.id} ${action}ed user ${targetUserId}`);

    return new Response(JSON.stringify({ 
      success: true,
      status: newStatus 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in block-user:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
