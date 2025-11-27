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

    // Check if payment already processed (idempotency)
    const { data: existingPurchase } = await supabaseAdmin
      .from("booster_purchases")
      .select("id")
      .eq("iap_transaction_id", sessionId)
      .single();

    if (existingPurchase) {
      console.log(`[verify-premium-booster-payment] Payment already processed: ${sessionId}`);
      return new Response(
        JSON.stringify({ success: true, alreadyProcessed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get booster definition
    const { data: boosterType } = await supabaseAdmin
      .from("booster_types")
      .select("*")
      .eq("code", "PREMIUM")
      .single();

    if (!boosterType) {
      throw new Error("Booster type not found");
    }

    const rewardGold = boosterType.reward_gold || 0;
    const rewardLives = boosterType.reward_lives || 0;

    // TRANSACTIONAL: Use credit_wallet() RPC function for atomic operation
    const idempotencyKey = `premium_booster:${sessionId}`;
    
    const { data: creditResult, error: creditError } = await supabaseAdmin.rpc('credit_wallet', {
      p_user_id: user.id,
      p_delta_coins: rewardGold,
      p_delta_lives: rewardLives,
      p_source: 'booster_purchase',
      p_idempotency_key: idempotencyKey,
      p_metadata: {
        booster_code: "PREMIUM",
        stripe_session_id: sessionId,
        timestamp: new Date().toISOString()
      }
    });

    if (creditError) {
      throw new Error(`Failed to credit wallet: ${creditError.message}`);
    }

    if (!creditResult?.success) {
      throw new Error(creditResult?.error || 'Wallet credit failed');
    }

    const newGold = creditResult.new_coins;
    const newLives = creditResult.new_lives;

    // Log purchase
    await supabaseAdmin.from("booster_purchases").insert({
      user_id: user.id,
      booster_type_id: boosterType.id,
      purchase_source: "stripe_checkout",
      usd_cents_spent: 249,
      gold_spent: 0,
      iap_transaction_id: sessionId
    });

    // Set pending premium flag
    await supabaseAdmin
      .from("user_premium_booster_state")
      .upsert({
        user_id: user.id,
        has_pending_premium_booster: true,
        updated_at: new Date().toISOString()
      });

    // Create Speed tokens (but don't activate them yet - user must click "Aktiválom")
    const rewardSpeedCount = boosterType.reward_speed_count || 0;
    const rewardSpeedDuration = boosterType.reward_speed_duration_min || 0;

    console.log(`[verify-premium-booster-payment] Creating ${rewardSpeedCount} speed tokens of ${rewardSpeedDuration} minutes each`);

    const speedTokens = [];
    for (let i = 0; i < rewardSpeedCount; i++) {
      speedTokens.push({
        user_id: user.id,
        duration_minutes: rewardSpeedDuration,
        source: 'PREMIUM_BOOSTER'
        // used_at and expires_at are NULL - tokens are pending activation
      });
    }

    if (speedTokens.length > 0) {
      const { error: speedError } = await supabaseAdmin
        .from("speed_tokens")
        .insert(speedTokens);

      if (speedError) {
        console.error("[verify-premium-booster-payment] Speed tokens creation error:", speedError);
      } else {
        console.log(`[verify-premium-booster-payment] Successfully created ${rewardSpeedCount} speed tokens (pending activation)`);
      }
    }

    console.log(`[verify-premium-booster-payment] Success! User ${user.id} received +${rewardGold} gold, +${rewardLives} lives, ${rewardSpeedCount} speed tokens created, pending premium flag set`);

    return new Response(
      JSON.stringify({
        success: true,
        grantedRewards: {
          gold: rewardGold,
          lives: rewardLives,
          speedCount: rewardSpeedCount
        },
        balance: {
          gold: newGold,
          lives: newLives
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
