import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

/**
 * Claim pending daily rank reward
 * Credits gold and lives to user wallet when they accept the reward
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

    // Use service role for transaction
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get pending reward and lock for update
    const { data: pendingReward, error: rewardError } = await supabaseService
      .from('daily_winner_awarded')
      .select('*')
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

    const { gold_awarded, lives_awarded, rank } = pendingReward;
    const rewardPayload = pendingReward.reward_payload || {};
    const countryCode = rewardPayload.country_code || 'unknown';

    // Credit gold (coins)
    const coinCorrelationId = `daily-rank-claim:${user.id}:${day_date}:${rank}:${countryCode}`;
    const { error: coinError } = await supabaseService
      .rpc('credit_wallet', {
        p_user_id: user.id,
        p_delta_coins: gold_awarded,
        p_delta_lives: 0,
        p_source: 'daily_rank_reward',
        p_idempotency_key: coinCorrelationId,
        p_metadata: {
          day_date,
          rank,
          country_code: countryCode,
          gold: gold_awarded,
          claimed_at: new Date().toISOString()
        }
      });

    if (coinError) {
      console.error('[CLAIM-REWARD] Coin credit error:', coinError);
      return new Response(
        JSON.stringify({ error: 'Failed to credit coins' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Credit lives
    const livesCorrelationId = `daily-rank-lives-claim:${user.id}:${day_date}:${rank}:${countryCode}`;
    const { error: livesError } = await supabaseService
      .rpc('credit_lives', {
        p_user_id: user.id,
        p_delta_lives: lives_awarded,
        p_source: 'daily_rank_reward',
        p_idempotency_key: livesCorrelationId,
        p_metadata: {
          day_date,
          rank,
          country_code: countryCode,
          lives: lives_awarded,
          claimed_at: new Date().toISOString()
        }
      });

    if (livesError) {
      console.error('[CLAIM-REWARD] Lives credit error:', livesError);
      return new Response(
        JSON.stringify({ error: 'Failed to credit lives' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to claimed
    const { error: updateError } = await supabaseService
      .from('daily_winner_awarded')
      .update({ 
        status: 'claimed',
        claimed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('day_date', day_date)
      .eq('status', 'pending');

    if (updateError) {
      console.error('[CLAIM-REWARD] Status update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update reward status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CLAIM-REWARD] User ${user.id} claimed rank ${rank} reward: ${gold_awarded} gold, ${lives_awarded} lives`);

    return new Response(
      JSON.stringify({ 
        success: true,
        goldCredited: gold_awarded,
        livesCredited: lives_awarded,
        rank
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CLAIM-REWARD] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
