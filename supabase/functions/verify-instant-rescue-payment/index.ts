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
    console.log('[verify-instant-rescue-payment] Request received');
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('[verify-instant-rescue-payment] Missing authorization header');
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[verify-instant-rescue-payment] Unauthorized:', userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      console.error('[verify-instant-rescue-payment] Missing sessionId');
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // SECURITY: Validate session ID format
    if (!/^cs_/.test(sessionId)) {
      console.error('[verify-instant-rescue-payment] Invalid session ID format');
      return new Response(JSON.stringify({ error: "Invalid session ID format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('[verify-instant-rescue-payment] Session ID:', sessionId, 'User ID:', user.id);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('[verify-instant-rescue-payment] Stripe session status:', session.payment_status);

    // SECURITY: Check session expiry (24 hours)
    const sessionAge = Date.now() - (session.created * 1000);
    if (sessionAge > 24 * 60 * 60 * 1000) {
      console.warn('[verify-instant-rescue-payment] Session expired');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Session expired' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (session.payment_status !== 'paid') {
      console.warn('[verify-instant-rescue-payment] Payment not completed');
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
      console.error('[verify-instant-rescue-payment] User mismatch. Session user:', userId, 'Auth user:', user.id);
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
      console.log('[verify-instant-rescue-payment] Already processed session:', sessionId);
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
    const boosterTypeId = session.metadata?.booster_type_id;
    const goldReward = parseInt(session.metadata?.gold_reward || '0');
    const livesReward = parseInt(session.metadata?.lives_reward || '0');
    const priceUsdCents = session.amount_total || 0;

    console.log('[verify-instant-rescue-payment] Rewards:', {
      boosterTypeId,
      goldReward,
      livesReward,
      priceUsdCents
    });

    // Record purchase in booster_purchases
    const { error: purchaseError } = await supabaseAdmin
      .from('booster_purchases')
      .insert({
        user_id: user.id,
        booster_type_id: boosterTypeId,
        purchase_source: 'instant_rescue',
        purchase_context: 'in_game_rescue',
        usd_cents_spent: priceUsdCents,
        gold_spent: 0,
        iap_transaction_id: sessionId
      });

    if (purchaseError) {
      console.error('[verify-instant-rescue-payment] Failed to record purchase:', purchaseError);
      throw purchaseError;
    }

    // TRANSACTIONAL: Use credit_wallet() RPC function for atomic operation
    const idempotencyKey = `instant-rescue-payment:${sessionId}:wallet`;
    
    await withRetry(async () => {
      const { data: creditResult, error: creditError } = await supabaseAdmin.rpc('credit_wallet', {
        p_user_id: user.id,
        p_delta_coins: goldReward,
        p_delta_lives: livesReward,
        p_source: 'instant_rescue_purchase',
        p_idempotency_key: idempotencyKey,
        p_metadata: {
          session_id: sessionId,
          booster_type_id: boosterTypeId
        }
      });

      if (creditError) {
        throw creditError;
      }

      if (!creditResult?.success) {
        throw new Error(creditResult?.error || 'Failed to credit wallet');
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      gold_granted: goldReward,
      lives_granted: livesReward,
      new_balance: {
        gold: goldReward,
        lives: livesReward
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[verify-instant-rescue-payment] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
