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

    // **WEBHOOK-FIRST IDEMPOTENCY CHECK**
    const { data: existingPurchase } = await supabaseAdmin
      .from('booster_purchases')
      .select('id')
      .eq('iap_transaction_id', sessionId)
      .single();

    if (existingPurchase) {
      console.log('[verify-instant-rescue-payment] Already processed by webhook:', sessionId);
      
      const goldReward = parseInt(session.metadata?.gold_reward || '0');
      const livesReward = parseInt(session.metadata?.lives_reward || '0');
      
      return new Response(JSON.stringify({ 
        success: true,
        already_processed: true,
        gold_granted: goldReward,
        lives_granted: livesReward,
        message: 'Payment already processed' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ============================================================
    // FALLBACK: Webhook hasn't processed → call atomic RPC
    // ============================================================
    console.log('[verify-instant-rescue-payment] Webhook not processed, calling RPC fallback');
    
    const payload = {
      booster_type_id: session.metadata?.booster_type_id,
      gold_reward: session.metadata?.gold_reward,
      lives_reward: session.metadata?.lives_reward,
      price_usd_cents: session.amount_total
    };

    const gameSessionId = session.metadata?.game_session_id || null;

    const { data: result, error: rpcError } = await supabaseAdmin
      .rpc('apply_instant_rescue_from_stripe', {
        p_user_id: user.id,
        p_session_id: sessionId,
        p_game_session_id: gameSessionId,
        p_payload: payload
      });

    if (rpcError) {
      console.error('[verify-instant-rescue-payment] RPC error:', rpcError);
      throw rpcError;
    }

    console.log('[verify-instant-rescue-payment] RPC success. Gold:', result?.gold_granted, 'Lives:', result?.lives_granted);

    return new Response(JSON.stringify({
      success: true,
      gold_granted: result?.gold_granted || 0,
      lives_granted: result?.lives_granted || 0
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
