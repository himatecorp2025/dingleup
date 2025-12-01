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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract and decode JWT from Authorization header to get user ID
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('[CLAIM-REWARD] Missing bearer token in Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub as string;

      if (!userId) {
        throw new Error('Missing sub (user id) in JWT payload');
      }
    } catch (e) {
      console.error('[CLAIM-REWARD] Failed to decode JWT:', e);
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

    // PERFORMANCE OPTIMIZATION: Use atomic RPC instead of multi-step logic
    // Before: 4 roundtrips (profile, reward, credit_wallet, credit_lives, update)
    // After: 1 roundtrip (atomic RPC handles everything)
    const startClaim = Date.now();

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user country_code (still needed for RPC parameter)
    const { data: userProfile, error: profileError } = await supabaseService
      .from('profiles')
      .select('country_code')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile?.country_code) {
      console.error('[CLAIM-REWARD] Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile or country not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call atomic RPC (all logic in single transaction with row lock)
    const { data: claimResult, error: rpcError } = await supabaseService
      .rpc('claim_daily_winner_reward', {
        p_user_id: userId,
        p_day_date: day_date,
        p_country_code: userProfile.country_code
      });

    const claimElapsed = Date.now() - startClaim;

    if (rpcError) {
      console.error('[CLAIM-REWARD] RPC error:', rpcError);
      return new Response(
        JSON.stringify({ error: 'Failed to claim reward' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle RPC response
    if (!claimResult?.success) {
      const errorCode = claimResult?.error_code;
      
      if (errorCode === 'NO_PENDING_REWARD') {
        return new Response(
          JSON.stringify({ error: 'No pending reward found or already claimed/lost' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (errorCode === 'LOCK_TIMEOUT') {
        console.warn('[CLAIM-REWARD] Lock timeout - concurrent claim attempt');
        return new Response(
          JSON.stringify({ error: 'Reward claim in progress, please try again' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Unknown error
      return new Response(
        JSON.stringify({ error: claimResult?.message || 'Unknown error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success response (matches existing API contract)
    const { gold, lives, rank, already_processed } = claimResult;
    
    console.log(`[CLAIM-REWARD] User ${userId} claimed rank ${rank}: ${gold} gold, ${lives} lives (${already_processed ? 'idempotent' : 'new'}) in ${claimElapsed}ms`);

    return new Response(
      JSON.stringify({ 
        success: true,
        goldCredited: gold,
        livesCredited: lives,
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
