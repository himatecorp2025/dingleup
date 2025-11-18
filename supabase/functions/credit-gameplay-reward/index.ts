import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, sourceId, reason } = await req.json();

    // Basic validation
    const amt = Number(amount);
    if (!sourceId || !Number.isFinite(amt) || amt <= 0 || amt > 1000) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const idempotencyKey = `game_reward:${user.id}:${String(sourceId)}`;

    // Credit coins idempotently via trusted RPC
    const { data: creditRes, error: creditErr } = await supabaseClient.rpc('credit_wallet', {
      p_user_id: user.id,
      p_delta_coins: amt,
      p_delta_lives: 0,
      p_source: 'game_reward',
      p_idempotency_key: idempotencyKey,
      p_metadata: {
        reason: reason || 'correct_answer',
        source_id: sourceId,
      },
    });

    if (creditErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to credit reward' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: amt,
        new_balance: creditRes?.new_coins ?? null,
        transaction_id: idempotencyKey,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});