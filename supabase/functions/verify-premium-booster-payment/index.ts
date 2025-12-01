import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflight } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitExceeded, RATE_LIMITS } from '../_shared/rateLimit.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // SECURITY: Rate limiting - max 10 verification attempts per minute
    const rateLimitResult = await checkRateLimit(supabaseClient, 'verify-premium-booster-payment', { maxRequests: 10, windowMinutes: 1 });
    if (!rateLimitResult.allowed) {
      return rateLimitExceeded(corsHeaders);
    }

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID required");
    }

    // SECURITY: Validate session ID format
    if (!/^cs_/.test(sessionId)) {
      return new Response(
        JSON.stringify({ success: false, error: "INVALID_SESSION_FORMAT" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve and verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // SECURITY: Check session expiry (24 hours)
    const sessionAge = Date.now() - (session.created * 1000);
    if (sessionAge > 24 * 60 * 60 * 1000) {
      return new Response(
        JSON.stringify({ success: false, error: "SESSION_EXPIRED" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ success: false, error: "PAYMENT_NOT_COMPLETED" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (session.metadata?.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "INVALID_SESSION" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // **WEBHOOK-FIRST IDEMPOTENCY CHECK**
    const { data: existingPurchase } = await supabaseAdmin
      .from("booster_purchases")
      .select("id")
      .eq("iap_transaction_id", sessionId)
      .single();

    if (existingPurchase) {
      console.log(`[verify-premium-booster-payment] Already processed by webhook: ${sessionId}`);
      
      // Get booster type to return correct values
      const { data: boosterType } = await supabaseAdmin
        .from("booster_types")
        .select("*")
        .eq("code", "PREMIUM")
        .single();
      
      const rewardGold = boosterType?.reward_gold || 0;
      const rewardLives = boosterType?.reward_lives || 0;
      const rewardSpeedCount = boosterType?.reward_speed_count || 0;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          alreadyProcessed: true,
          grantedRewards: {
            gold: rewardGold,
            lives: rewardLives,
            speedCount: rewardSpeedCount
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ============================================================
    // FALLBACK: Webhook hasn't processed → call atomic RPC
    // ============================================================
    console.log('[verify-premium-booster-payment] Webhook not processed, calling RPC fallback');
    
    // Get booster definition
    const { data: boosterType } = await supabaseAdmin
      .from("booster_types")
      .select("*")
      .eq("code", "PREMIUM")
      .single();

    if (!boosterType) {
      throw new Error("Booster type not found");
    }

    const payload = {
      gold_reward: boosterType.reward_gold || 0,
      lives_reward: boosterType.reward_lives || 0,
      speed_token_count: boosterType.reward_speed_count || 0,
      speed_duration_min: boosterType.reward_speed_duration_min || 0,
      price_usd_cents: 249,
      purchase_source: 'stripe_checkout',
      token_source: 'PREMIUM_BOOSTER'
    };

    const { data: result, error: rpcError } = await supabaseAdmin
      .rpc('apply_booster_purchase_from_stripe', {
        p_user_id: user.id,
        p_session_id: sessionId,
        p_booster_code: 'PREMIUM',
        p_payload: payload
      });

    if (rpcError) {
      console.error('[verify-premium-booster-payment] RPC error:', rpcError);
      throw rpcError;
    }

    const actualSpeedCount = result?.speed_tokens_granted || 0;
    console.log(`[verify-premium-booster-payment] RPC success. Gold: ${result?.gold_granted}, Lives: ${result?.lives_granted}, Tokens: ${actualSpeedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        grantedRewards: {
          gold: result?.gold_granted || 0,
          lives: result?.lives_granted || 0,
          speedCount: actualSpeedCount
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[verify-premium-booster-payment] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
