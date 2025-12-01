import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitExceeded, RATE_LIMITS } from '../_shared/rateLimit.ts';
import { validateInteger } from '../_shared/validation.ts';
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

    // Extract JWT token from Bearer header
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

    // Use the JWT token directly with auth.getUser()
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ctx = startMetrics({ functionName: 'credit-gameplay-reward', userId: user.id });
    ctx.extra['correlation_id'] = correlationId;

    // SECURITY: Rate limiting check
    const rateLimitResult = await measureStage(ctx, 'rate_limit', async () => {
      return await checkRateLimit(supabaseClient, 'credit-gameplay-reward', { maxRequests: 30, windowMinutes: 1 });
    });
    if (!rateLimitResult.allowed) {
      logError(ctx, new Error('RATE_LIMIT_EXCEEDED'), { correlation_id: correlationId });
      return rateLimitExceeded(corsHeaders);
    }

    const { amount, sourceId, reason } = await req.json();

    // SECURITY: Enhanced validation
    const amt = validateInteger(amount, 'amount', { min: 1, max: 1000 });
    if (!sourceId || typeof sourceId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid sourceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL IDEMPOTENCY KEY CONSTRUCTION: "game_reward:userId:sourceId"
    // - userId ensures user isolation
    // - sourceId is session_id + question_index, ensuring per-question uniqueness
    // - This key MUST remain stable - changing format breaks duplicate detection
    // - DO NOT modify this format without migrating all existing keys in wallet_ledger
    // - Changing this format will allow duplicate rewards for already-answered questions
    const idempotencyKey = `game_reward:${user.id}:${String(sourceId)}`;

    // Credit coins idempotently via trusted RPC
    const { data: creditRes, error: creditErr } = await measureStage(ctx, 'credit_rpc', async () => {
      incDbQuery(ctx);
      return await supabaseClient.rpc('credit_wallet', {
        p_user_id: user.id,
        p_delta_coins: amt,
        p_delta_lives: 0,
        p_source: 'game_reward',
        p_idempotency_key: idempotencyKey,
        p_metadata: {
          reason: reason || 'correct_answer',
          source_id: sourceId,
          correlation_id: correlationId,
        },
      });
    });

    if (creditErr) {
      logError(ctx, creditErr, { correlation_id: correlationId, amount: amt });
      return new Response(
        JSON.stringify({ error: 'Failed to credit reward', correlation_id: correlationId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (shouldSampleSuccessLog()) {
      logSuccess(ctx, { correlation_id: correlationId, amount: amt, new_balance: creditRes?.new_coins });
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: amt,
        new_balance: creditRes?.new_coins ?? null,
        transaction_id: idempotencyKey,
        correlation_id: correlationId,
        performance: {
          elapsed_ms: Date.now() - ctx.startTime
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const ctx = startMetrics({ functionName: 'credit-gameplay-reward', userId: undefined });
    logError(ctx, e, { correlation_id: correlationId });
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', correlation_id: correlationId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});