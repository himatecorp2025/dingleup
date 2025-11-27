import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log('[verify-speed-boost-payment] Request received');
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('[verify-speed-boost-payment] Missing authorization header');
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[verify-speed-boost-payment] Unauthorized:', userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      console.error('[verify-speed-boost-payment] Missing sessionId');
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // SECURITY: Validate session ID format
    if (!/^cs_/.test(sessionId)) {
      console.error('[verify-speed-boost-payment] Invalid session ID format');
      return new Response(JSON.stringify({ error: "Invalid session ID format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('[verify-speed-boost-payment] Session ID:', sessionId, 'User ID:', user.id);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('[verify-speed-boost-payment] Stripe session status:', session.payment_status);

    // SECURITY: Check session expiry (24 hours)
    const sessionAge = Date.now() - (session.created * 1000);
    if (sessionAge > 24 * 60 * 60 * 1000) {
      console.warn('[verify-speed-boost-payment] Session expired');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Session expired' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (session.payment_status !== 'paid') {
      console.warn('[verify-speed-boost-payment] Payment not completed');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payment not completed' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify user_id matches
    const userId = session.metadata?.user_id;
    if (!userId || userId !== user.id) {
      console.error('[verify-speed-boost-payment] User mismatch. Session user:', userId, 'Auth user:', user.id);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User mismatch' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // **IDEMPOTENCY CHECK** - prevent duplicate processing
    const { data: existingPurchase } = await supabaseAdmin
      .from('booster_purchases')
      .select('id')
      .eq('iap_transaction_id', sessionId)
      .single();

    if (existingPurchase) {
      console.log('[verify-speed-boost-payment] Already processed session:', sessionId);
      return new Response(JSON.stringify({ 
        success: true,
        already_processed: true,
        message: 'Payment already processed' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract metadata
    const speedTokenCount = parseInt(session.metadata?.speed_token_count || '1');
    const speedDurationMin = parseInt(session.metadata?.speed_duration_min || '10');
    const goldReward = parseInt(session.metadata?.gold_reward || '0');
    const livesReward = parseInt(session.metadata?.lives_reward || '0');
    const priceUsdCents = session.amount_total || 0;

    console.log('[verify-speed-boost-payment] Rewards:', {
      speedTokenCount,
      speedDurationMin,
      goldReward,
      livesReward,
      priceUsdCents
    });

    // Get or create booster_type for speed boost
    let { data: boosterType } = await supabaseAdmin
      .from('booster_types')
      .select('id')
      .eq('code', 'SPEED_BOOST')
      .single();

    if (!boosterType) {
      const { data: newBoosterType, error: createError } = await supabaseAdmin
        .from('booster_types')
        .insert({
          code: 'SPEED_BOOST',
          name: 'GigaSpeed',
          description: 'Speed boost purchase',
          price_usd_cents: priceUsdCents,
          reward_gold: goldReward,
          reward_lives: livesReward,
          reward_speed_count: speedTokenCount,
          reward_speed_duration_min: speedDurationMin,
          is_active: true
        })
        .select('id')
        .single();

      if (createError) {
        console.error('[verify-speed-boost-payment] Failed to create booster_type:', createError);
        throw createError;
      }
      boosterType = newBoosterType;
    }

    // Record purchase in booster_purchases
    const { error: purchaseError } = await supabaseAdmin
      .from('booster_purchases')
      .insert({
        user_id: user.id,
        booster_type_id: boosterType.id,
        purchase_source: 'speed_boost_shop',
        purchase_context: 'direct_purchase',
        usd_cents_spent: priceUsdCents,
        gold_spent: 0,
        iap_transaction_id: sessionId
      });

    if (purchaseError) {
      console.error('[verify-speed-boost-payment] Failed to record purchase:', purchaseError);
      throw purchaseError;
    }

    // Credit gold and lives if any
    if (goldReward > 0 || livesReward > 0) {
      const idempotencyKey = `speed-boost-payment:${sessionId}:wallet`;
      
      // TRANSACTIONAL: Use credit_wallet() RPC function for atomic operation
      await withRetry(async () => {
        const { data: creditResult, error: creditError } = await supabaseAdmin.rpc('credit_wallet', {
          p_user_id: user.id,
          p_delta_coins: goldReward,
          p_delta_lives: livesReward,
          p_source: 'speed_boost_purchase',
          p_idempotency_key: idempotencyKey,
          p_metadata: {
            session_id: sessionId,
            speed_token_count: speedTokenCount,
            speed_duration_min: speedDurationMin
          }
        });

        if (creditError) {
          throw creditError;
        }

        if (!creditResult?.success) {
          throw new Error(creditResult?.error || 'Failed to credit wallet');
        }
      });
    }

    // Create speed tokens
    const speedTokenInserts: Array<{
      user_id: string;
      duration_minutes: number;
      source: string;
      metadata: Record<string, string>;
    }> = [];
    for (let i = 0; i < speedTokenCount; i++) {
      speedTokenInserts.push({
        user_id: user.id,
        duration_minutes: speedDurationMin,
        source: 'purchase',
        metadata: {
          session_id: sessionId,
          purchased_at: new Date().toISOString()
        }
      });
    }

    await withRetry(async () => {
      const { error: tokenError } = await supabaseAdmin
        .from('speed_tokens')
        .insert(speedTokenInserts);

      if (tokenError) {
        throw tokenError;
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      tokens_granted: speedTokenCount,
      gold_granted: goldReward,
      lives_granted: livesReward
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[verify-speed-boost-payment] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
