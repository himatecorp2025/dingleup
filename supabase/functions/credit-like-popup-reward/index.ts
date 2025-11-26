import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { questionId } = await req.json();

    // Generate idempotency key (user + question + date ensures one reward per question per day max)
    const today = new Date().toISOString().split('T')[0];
    const idempotencyKey = `like-popup-reward:${user.id}:${questionId}:${today}`;

    // Check if already processed
    const { data: existing } = await supabase
      .from('wallet_ledger')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) {
      console.log('[credit-like-popup-reward] Already processed:', idempotencyKey);
      return new Response(
        JSON.stringify({ success: true, alreadyProcessed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Credit +10 coins via wallet_ledger (automatic profile update via trigger)
    const { error: creditError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: user.id,
        delta_coins: 10,
        delta_lives: 0,
        source: 'like_popup_reward',
        idempotency_key: idempotencyKey,
        metadata: {
          question_id: questionId,
          date: today,
        }
      });

    if (creditError) {
      console.error('[credit-like-popup-reward] Error crediting coins:', creditError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to credit coins' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[credit-like-popup-reward] Successfully credited 10 coins to user:', user.id);

    return new Response(
      JSON.stringify({ success: true, coinsAdded: 10 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[credit-like-popup-reward] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
