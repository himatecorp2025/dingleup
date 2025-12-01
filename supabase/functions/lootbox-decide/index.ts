import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from "../_shared/cors.ts";
import { generateLootboxRewards } from "../_shared/lootboxRewards.ts";
import { checkRateLimit, rateLimitExceeded } from '../_shared/rateLimit.ts';
import { startMetrics, measureStage, incDbQuery, logSuccess, logError, shouldSampleSuccessLog } from '../_shared/metrics.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }

  const corsHeaders = getCorsHeaders(origin);
  const correlationId = crypto.randomUUID();

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

    const ctx = startMetrics({ functionName: 'lootbox-decide', userId: user.id });
    ctx.extra['correlation_id'] = correlationId;

    // Rate limiting
    const rateLimitResult = await measureStage(ctx, 'rate_limit', async () => {
      return await checkRateLimit(supabaseClient, 'lootbox-decide', { maxRequests: 30, windowMinutes: 1 });
    });
    if (!rateLimitResult.allowed) {
      logError(ctx, new Error('RATE_LIMIT_EXCEEDED'), { correlation_id: correlationId });
      return rateLimitExceeded(corsHeaders);
    }

    const { lootboxId, decision } = await req.json();

    // Validate input
    if (!lootboxId || typeof lootboxId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid lootboxId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!decision || !['open_now', 'store'].includes(decision)) {
      return new Response(
        JSON.stringify({ error: 'Invalid decision. Must be "open_now" or "store"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify lootbox exists and belongs to user with status = 'active_drop'
    const { data: lootbox, error: lootboxError } = await measureStage(ctx, 'lootbox_lookup', async () => {
      incDbQuery(ctx);
      return await supabaseService
        .from('lootbox_instances')
        .select('*')
        .eq('id', lootboxId)
        .eq('user_id', user.id)
        .eq('status', 'active_drop')
        .single();
    });

    if (lootboxError || !lootbox) {
      console.log('Lootbox not found or invalid:', { lootboxId, userId: user.id, error: lootboxError });
      return new Response(
        JSON.stringify({ error: 'Lootbox not found or already processed' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (decision === 'store') {
      // Store for later - update status to 'stored'
      const { data: updated, error: updateError } = await measureStage(ctx, 'store_update', async () => {
        incDbQuery(ctx);
        return await supabaseService
          .from('lootbox_instances')
          .update({
            status: 'stored',
            expires_at: null,
          })
          .eq('id', lootboxId)
          .select()
          .single();
      });

      if (updateError) {
        logError(ctx, updateError, { correlation_id: correlationId, lootboxId, decision: 'store' });
        return new Response(
          JSON.stringify({ error: 'Failed to store lootbox', correlation_id: correlationId }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (shouldSampleSuccessLog()) {
        logSuccess(ctx, { correlation_id: correlationId, lootboxId, decision: 'store' });
      }

      return new Response(
        JSON.stringify({
          success: true,
          lootbox: updated,
          message: 'Lootbox stored for later opening',
          correlation_id: correlationId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // decision === 'open_now'
    // Generate rewards
    const rewards = generateLootboxRewards();
    // CRITICAL IDEMPOTENCY KEY: "lootbox_open::<lootbox_id>"
    // - lootbox_id ensures per-lootbox uniqueness (same lootbox cannot be opened twice)
    // - This key MUST remain stable - changing format breaks duplicate detection
    // - DO NOT add timestamps, user_id, or random values to this key
    // - The RPC open_lootbox_transaction() enforces idempotency via this key
    const idempotencyKey = `lootbox_open::${lootboxId}`;

    console.log('Opening lootbox now:', { 
      lootboxId, 
      userId: user.id, 
      tier: rewards.tier,
      gold: rewards.gold,
      life: rewards.life,
    });

    // Call PostgreSQL transaction function
    const { data: result, error: txError } = await measureStage(ctx, 'open_transaction', async () => {
      incDbQuery(ctx);
      return await supabaseService.rpc(
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
    });

    if (txError) {
      logError(ctx, txError, { correlation_id: correlationId, lootboxId, decision: 'open_now' });
      return new Response(
        JSON.stringify({ error: 'Failed to open lootbox', details: txError.message, correlation_id: correlationId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!result || !result.success) {
      const errorCode = result?.error || 'UNKNOWN_ERROR';
      ctx.extra['error_code'] = errorCode;
      logError(ctx, new Error(errorCode), { correlation_id: correlationId, result });
      
      return new Response(
        JSON.stringify({
          error: errorCode,
          required: result?.required,
          current: result?.current,
          correlation_id: correlationId,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (shouldSampleSuccessLog()) {
      logSuccess(ctx, { correlation_id: correlationId, lootboxId, tier: rewards.tier, gold: rewards.gold, life: rewards.life });
    }

    return new Response(
      JSON.stringify({
        success: true,
        lootbox: result.lootbox,
        rewards: result.rewards,
        new_balance: result.new_balance,
        correlation_id: correlationId,
        performance: {
          elapsed_ms: Date.now() - ctx.startTime
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    const ctx = startMetrics({ functionName: 'lootbox-decide', userId: undefined });
    logError(ctx, e, { correlation_id: correlationId });
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', correlation_id: correlationId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
