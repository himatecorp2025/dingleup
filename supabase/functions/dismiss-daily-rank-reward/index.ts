import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

/**
 * Dismiss pending daily rank reward
 * Marks reward as 'lost' when user closes popup without claiming
 */
serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for day_date
    const { day_date } = await req.json();
    if (!day_date) {
      return new Response(
        JSON.stringify({ error: 'Missing day_date parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to ensure update happens
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify pending reward exists
    const { data: pendingReward, error: rewardError } = await supabaseService
      .from('daily_winner_awarded')
      .select('rank, gold_awarded, lives_awarded')
      .eq('user_id', user.id)
      .eq('day_date', day_date)
      .eq('status', 'pending')
      .single();

    if (rewardError || !pendingReward) {
      return new Response(
        JSON.stringify({ error: 'No pending reward found or already claimed/lost' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to lost
    const { error: updateError } = await supabaseService
      .from('daily_winner_awarded')
      .update({ 
        status: 'lost',
        dismissed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('day_date', day_date)
      .eq('status', 'pending');

    if (updateError) {
      console.error('[DISMISS-REWARD] Status update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update reward status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[DISMISS-REWARD] User ${user.id} dismissed rank ${pendingReward.rank} reward: ${pendingReward.gold_awarded} gold, ${pendingReward.lives_awarded} lives (permanently lost)`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Reward permanently dismissed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[DISMISS-REWARD] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
