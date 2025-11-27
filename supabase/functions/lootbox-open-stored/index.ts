import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from "../_shared/cors.ts";
import { generateLootboxRewards } from "../_shared/lootboxRewards.ts";

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not logged in' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        }
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lootboxId } = await req.json();

    // Validate input
    if (!lootboxId || typeof lootboxId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid lootboxId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify lootbox exists and belongs to user with status = 'stored'
    const { data: lootbox, error: lootboxError } = await supabaseService
      .from('lootbox_instances')
      .select('*')
      .eq('id', lootboxId)
      .eq('user_id', user.id)
      .eq('status', 'stored')
      .single();

    if (lootboxError || !lootbox) {
      console.log('Stored lootbox not found:', { lootboxId, userId: user.id, error: lootboxError });
      return new Response(
        JSON.stringify({ error: 'Stored lootbox not found or already opened' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate rewards
    const rewards = generateLootboxRewards();
    const idempotencyKey = `lootbox_open::${lootboxId}`;

    console.log('Opening stored lootbox:', { 
      lootboxId, 
      userId: user.id, 
      tier: rewards.tier,
      gold: rewards.gold,
      life: rewards.life,
    });

    // Call PostgreSQL transaction function
    const { data: result, error: txError } = await supabaseService.rpc(
      'open_lootbox_transaction',
      {
        p_lootbox_id: lootboxId,
        p_user_id: user.id,
        p_tier: rewards.tier,
        p_gold_reward: rewards.gold,
        p_life_reward: rewards.life,
        p_idempotency_key: idempotencyKey,
      }
    );

    if (txError) {
      console.error('Transaction error:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to open lootbox', details: txError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!result || !result.success) {
      const errorCode = result?.error || 'UNKNOWN_ERROR';
      console.log('Stored lootbox opening failed:', { errorCode, result });
      
      return new Response(
        JSON.stringify({
          error: errorCode,
          required: result?.required,
          current: result?.current,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Stored lootbox opened successfully:', { 
      lootboxId, 
      userId: user.id,
      tier: rewards.tier,
      newBalance: result.new_balance,
    });

    return new Response(
      JSON.stringify({
        success: true,
        lootbox: result.lootbox,
        rewards: result.rewards,
        new_balance: result.new_balance,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    console.error('Unexpected error:', e);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
