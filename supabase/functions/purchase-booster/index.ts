import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BoosterPurchaseRequest {
  boosterCode: 'FREE' | 'PREMIUM' | 'GOLD_SAVER' | 'INSTANT_RESCUE';
  confirmInstantPurchase?: boolean;
}

interface BoosterPurchaseResponse {
  success: boolean;
  error?: string;
  balanceAfter?: {
    gold: number;
    lives: number;
    speedTokensAvailable: number;
  };
  grantedRewards?: {
    gold: number;
    lives: number;
    speedCount: number;
    speedDurationMinutes: number;
  };
  instantPremiumBoosterEnabled?: boolean;
  hasPendingPremiumBooster?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    const body: BoosterPurchaseRequest = await req.json();
    const { boosterCode, confirmInstantPurchase } = body;

    console.log(`[purchase-booster] User ${userId} purchasing ${boosterCode}`);

    // Get booster definition
    const { data: boosterType, error: boosterError } = await supabaseAdmin
      .from("booster_types")
      .select("*")
      .eq("code", boosterCode)
      .eq("is_active", true)
      .single();

    if (boosterError || !boosterType) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid booster type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (boosterCode === 'FREE') {
      // FREE BOOSTER LOGIC
      return await handleFreeBoosterPurchase(supabaseAdmin, userId, boosterType);
    } else if (boosterCode === 'PREMIUM') {
      // PREMIUM BOOSTER LOGIC
      return await handlePremiumBoosterPurchase(supabaseAdmin, userId, boosterType, confirmInstantPurchase);
    } else if (boosterCode === 'GOLD_SAVER') {
      // IN-GAME GOLD SAVER BOOSTER LOGIC
      return await handleGoldSaverPurchase(supabaseAdmin, userId, boosterType);
    } else if (boosterCode === 'INSTANT_RESCUE') {
      // IN-GAME INSTANT RESCUE BOOSTER LOGIC
      return await handleInstantRescuePurchase(supabaseAdmin, userId, boosterType);
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown booster code" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[purchase-booster] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// FREE BOOSTER: Pay 900 gold → Net -600 gold, grant +300 gold, +15 lives, 4× 30min speed tokens
// Total transaction: -900 + 300 = -600 net gold deduction
// IDEMPOTENCY: Uses timestamp-based idempotency_key - assumes no duplicate rapid clicks
// TODO FUTURE: Consider using request-scoped idempotency key for absolute protection
async function handleFreeBoosterPurchase(supabaseAdmin: any, userId: string, boosterType: any) {
  const priceGold = boosterType.price_gold || 0;
  const rewardGold = boosterType.reward_gold || 0;
  const rewardLives = boosterType.reward_lives || 0;
  const rewardSpeedCount = boosterType.reward_speed_count || 0;
  const rewardSpeedDuration = boosterType.reward_speed_duration_min || 0;

  console.log(`[FREE] Price: ${priceGold}, Rewards: gold=${rewardGold}, lives=${rewardLives}, speed=${rewardSpeedCount}x${rewardSpeedDuration}min`);

  // Get current user balance
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("coins, lives, max_lives")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return new Response(
      JSON.stringify({ success: false, error: "Profile not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const currentGold = profile.coins || 0;
  const currentLives = profile.lives || 0;
  const maxLives = profile.max_lives || 15;

  // Check gold availability
  if (currentGold < priceGold) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "NOT_ENOUGH_GOLD",
        balanceAfter: { gold: currentGold, lives: currentLives }
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Execute transaction: deduct gold, add rewards
  const newGold = currentGold - priceGold + rewardGold;
  const newLives = currentLives + rewardLives;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      coins: newGold,
      lives: newLives,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (updateError) {
    console.error("[FREE] Update error:", updateError);
    return new Response(
      JSON.stringify({ success: false, error: "Profile update failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Log transaction to wallet_ledger
  const idempotencyKey = `free_booster:${userId}:${Date.now()}`;
  const { error: ledgerError } = await supabaseAdmin
    .from("wallet_ledger")
    .insert({
      user_id: userId,
      delta_coins: rewardGold - priceGold,
      delta_lives: rewardLives,
      source: "booster_purchase",
      idempotency_key: idempotencyKey,
      metadata: {
        booster_type_id: boosterType.id,
        price_gold: priceGold,
        reward_gold: rewardGold,
        reward_lives: rewardLives,
        reward_speed_count: rewardSpeedCount,
        reward_speed_duration_min: rewardSpeedDuration
      }
    });

  if (ledgerError) {
    console.error("[FREE] Ledger insert error:", ledgerError);
  }

  // Log purchase
  const { error: purchaseError } = await supabaseAdmin
    .from("booster_purchases")
    .insert({
      user_id: userId,
      booster_type_id: boosterType.id,
      purchase_source: "GOLD",
      gold_spent: priceGold,
      usd_cents_spent: 0,
      purchase_context: "PROFILE"
    });

  if (purchaseError) {
    console.error("[FREE] Purchase log error:", purchaseError);
  }

  // Track purchase completion
  await supabaseAdmin
    .from("conversion_events")
    .insert({
      user_id: userId,
      event_type: "purchase_complete",
      product_type: "booster",
      product_id: boosterType.code,
      session_id: `session_${userId}_${Date.now()}`,
      metadata: {
        booster_code: boosterType.code,
        price_gold: priceGold,
        reward_gold: rewardGold,
        reward_lives: rewardLives
      }
    });

  // Create Speed tokens (but don't activate them yet - user must click "Aktiválom")
  console.log(`[FREE] Creating ${rewardSpeedCount} Speed tokens of ${rewardSpeedDuration} minutes each`);
  
  const speedTokens = [];
  for (let i = 0; i < rewardSpeedCount; i++) {
    speedTokens.push({
      user_id: userId,
      duration_minutes: rewardSpeedDuration,
      source: 'FREE_BOOSTER'
      // used_at and expires_at are NULL - token is pending activation
    });
  }

  if (speedTokens.length > 0) {
    const { error: speedError } = await supabaseAdmin
      .from("speed_tokens")
      .insert(speedTokens);

    if (speedError) {
      console.error("[FREE] Speed tokens creation error:", speedError);
    } else {
      console.log(`[FREE] Successfully created ${rewardSpeedCount} speed tokens (pending activation)`);
    }
  }

  const response: BoosterPurchaseResponse = {
    success: true,
    balanceAfter: {
      gold: newGold,
      lives: newLives,
      speedTokensAvailable: rewardSpeedCount
    },
    grantedRewards: {
      gold: rewardGold,
      lives: rewardLives,
      speedCount: rewardSpeedCount,
      speedDurationMinutes: rewardSpeedDuration
    }
  };

  return new Response(
    JSON.stringify(response),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handlePremiumBoosterPurchase(
  supabaseAdmin: any,
  userId: string,
  boosterType: any,
  confirmInstantPurchase?: boolean
) {
  const rewardGold = boosterType.reward_gold || 0;
  const rewardLives = boosterType.reward_lives || 0;
  const priceUsdCents = boosterType.price_usd_cents || 0;

  console.log(`[PREMIUM] Rewards: gold=${rewardGold}, lives=${rewardLives}, price=$${(priceUsdCents / 100).toFixed(2)}`);

  try {
    // Get user purchase settings
    const { data: settings } = await supabaseAdmin
      .from("user_purchase_settings")
      .select("instant_premium_booster_enabled")
      .eq("user_id", userId)
      .single();

    const instantEnabled = settings?.instant_premium_booster_enabled || false;

    // Get premium booster state
    const { data: boosterState } = await supabaseAdmin
      .from("user_premium_booster_state")
      .select("has_pending_premium_booster")
      .eq("user_id", userId)
      .single();

    const hasPending = boosterState?.has_pending_premium_booster || false;

    // Check if pending premium exists
    if (hasPending) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PENDING_PREMIUM_EXISTS",
          instantPremiumBoosterEnabled: instantEnabled,
          hasPendingPremiumBooster: true
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check instant purchase confirmation
    if (!instantEnabled && !confirmInstantPurchase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INSTANT_PURCHASE_NOT_CONFIRMED",
          instantPremiumBoosterEnabled: false,
          hasPendingPremiumBooster: false
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If confirming instant purchase, enable it
    if (!instantEnabled && confirmInstantPurchase) {
      await supabaseAdmin
        .from("user_purchase_settings")
        .upsert({
          user_id: userId,
          instant_premium_booster_enabled: true,
          updated_at: new Date().toISOString()
        });
    }

    // **CRITICAL FIX - PRODUCTION BLOCKER**
    // Premium boosters MUST use real Stripe payment via create-premium-booster-payment
    // Simulated payment is REMOVED - this is a production security issue
    
    console.log('[PREMIUM] CRITICAL: Premium booster must use Stripe payment');
    console.log('[PREMIUM] Blocking simulated payment - redirect to create-premium-booster-payment');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "STRIPE_PAYMENT_REQUIRED",
        message: "Premium booster purchases must use Stripe. Call create-premium-booster-payment endpoint.",
        requiresStripeCheckout: true,
        boosterTypeId: boosterType.id,
        instantPremiumBoosterEnabled: instantEnabled || confirmInstantPurchase,
        hasPendingPremiumBooster: false
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    // ========== REMOVED SIMULATED PAYMENT CODE ==========
    // All code below this point is unreachable and will be removed in future cleanup
    // Real payment must go through create-premium-booster-payment + verify-premium-booster-payment
    // ====================================================

    // Get current balance
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("coins, lives")
      .eq("id", userId)
      .single();

    const currentGold = profile?.coins || 0;
    const currentLives = profile?.lives || 0;

    // Grant immediate rewards: gold + lives (NOT speed yet)
    const newGold = currentGold + rewardGold;
    const newLives = currentLives + rewardLives;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        coins: newGold,
        lives: newLives,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[PREMIUM] Profile update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Profile update failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set pending premium booster flag
    await supabaseAdmin
      .from("user_premium_booster_state")
      .upsert({
        user_id: userId,
        has_pending_premium_booster: true,
        last_premium_purchase_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    // Log wallet transaction
    const idempotencyKey = `premium_booster:${userId}:${Date.now()}`;
    await supabaseAdmin
      .from("wallet_ledger")
      .insert({
        user_id: userId,
        delta_coins: rewardGold,
        delta_lives: rewardLives,
        source: "booster_purchase",
        idempotency_key: idempotencyKey,
        metadata: {
          booster_type_id: boosterType.id,
          price_usd_cents: priceUsdCents,
          reward_gold: rewardGold,
          reward_lives: rewardLives,
          speed_pending: true
        }
      });

  // Log purchase
  await supabaseAdmin
    .from("booster_purchases")
    .insert({
      user_id: userId,
      booster_type_id: boosterType.id,
      purchase_source: "IAP",
      gold_spent: 0,
      usd_cents_spent: priceUsdCents,
      iap_transaction_id: `stripe_${Date.now()}`, // TODO: Replace with real Stripe transaction ID
      purchase_context: "DASHBOARD"
    });

  // Track purchase completion
  await supabaseAdmin
    .from("conversion_events")
    .insert({
      user_id: userId,
      event_type: "purchase_complete",
      product_type: "booster",
      product_id: boosterType.code,
      session_id: `session_${userId}_${Date.now()}`,
      metadata: {
        booster_code: boosterType.code,
        price_usd_cents: priceUsdCents,
        reward_gold: rewardGold,
        reward_lives: rewardLives
      }
    });

    console.log(`[PREMIUM] Purchase successful, pending activation`);

    const response: BoosterPurchaseResponse = {
      success: true,
      balanceAfter: {
        gold: newGold,
        lives: newLives,
        speedTokensAvailable: 0
      },
      grantedRewards: {
        gold: rewardGold,
        lives: rewardLives,
        speedCount: 0, // Not activated yet
        speedDurationMinutes: 0
      },
      instantPremiumBoosterEnabled: true,
      hasPendingPremiumBooster: true
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[PREMIUM] Transaction error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Transaction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GOLD_SAVER BOOSTER: Pay 500 gold → Net -250 gold, grant +250 gold, +15 lives, NO speed tokens
// Total transaction: -500 + 250 = -250 net gold deduction
// IDEMPOTENCY: Uses timestamp-based idempotency_key - assumes no duplicate rapid clicks
// TODO FUTURE: Consider using request-scoped idempotency key for absolute protection
async function handleGoldSaverPurchase(supabaseAdmin: any, userId: string, boosterType: any) {
  const priceGold = boosterType.price_gold || 0;
  const rewardGold = boosterType.reward_gold || 0;
  const rewardLives = boosterType.reward_lives || 0;

  console.log(`[GOLD_SAVER] Price: ${priceGold}, Rewards: gold=${rewardGold}, lives=${rewardLives}`);

  // Get current user balance
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("coins, lives")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return new Response(
      JSON.stringify({ success: false, error: "Profile not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const currentGold = profile.coins || 0;
  const currentLives = profile.lives || 0;

  // Check gold availability
  if (currentGold < priceGold) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "NOT_ENOUGH_GOLD",
        balanceAfter: { gold: currentGold, lives: currentLives, speedTokensAvailable: 0 }
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Execute transaction: deduct gold, add rewards
  const newGold = currentGold - priceGold + rewardGold;
  const newLives = currentLives + rewardLives;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      coins: newGold,
      lives: newLives,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (updateError) {
    console.error("[GOLD_SAVER] Update error:", updateError);
    return new Response(
      JSON.stringify({ success: false, error: "Profile update failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Log transaction to wallet_ledger
  const idempotencyKey = `gold_saver:${userId}:${Date.now()}`;
  const { error: ledgerError } = await supabaseAdmin
    .from("wallet_ledger")
    .insert({
      user_id: userId,
      delta_coins: rewardGold - priceGold,
      delta_lives: rewardLives,
      source: "booster_purchase",
      idempotency_key: idempotencyKey,
      metadata: {
        booster_type_id: boosterType.id,
        booster_code: 'GOLD_SAVER',
        price_gold: priceGold,
        reward_gold: rewardGold,
        reward_lives: rewardLives,
        purchase_context: 'INGAME'
      }
    });

  if (ledgerError) {
    console.error("[GOLD_SAVER] Ledger insert error:", ledgerError);
  }

  // Log purchase
  const { error: purchaseError } = await supabaseAdmin
    .from("booster_purchases")
    .insert({
      user_id: userId,
      booster_type_id: boosterType.id,
      purchase_source: "GOLD",
      gold_spent: priceGold,
      usd_cents_spent: 0,
      purchase_context: "INGAME"
    });

  if (purchaseError) {
    console.error("[GOLD_SAVER] Purchase log error:", purchaseError);
  }

  // Track purchase completion
  await supabaseAdmin
    .from("conversion_events")
    .insert({
      user_id: userId,
      event_type: "purchase_complete",
      product_type: "booster",
      product_id: boosterType.code,
      session_id: `session_${userId}_${Date.now()}`,
      metadata: {
        booster_code: boosterType.code,
        price_gold: priceGold,
        reward_gold: rewardGold,
        reward_lives: rewardLives,
        purchase_context: 'INGAME'
      }
    });

  console.log(`[GOLD_SAVER] Purchase successful, no speed tokens`);

  const response: BoosterPurchaseResponse = {
    success: true,
    balanceAfter: {
      gold: newGold,
      lives: newLives,
      speedTokensAvailable: 0
    },
    grantedRewards: {
      gold: rewardGold,
      lives: rewardLives,
      speedCount: 0,
      speedDurationMinutes: 0
    }
  };

  return new Response(
    JSON.stringify(response),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleInstantRescuePurchase(supabaseAdmin: any, userId: string, boosterType: any) {
  const rewardGold = boosterType.reward_gold || 0;
  const rewardLives = boosterType.reward_lives || 0;
  const priceUsdCents = boosterType.price_usd_cents || 0;

  console.log(`[INSTANT_RESCUE] CRITICAL: Instant Rescue must use Stripe payment`);
  console.log(`[INSTANT_RESCUE] Rewards would be: gold=${rewardGold}, lives=${rewardLives}, price=$${(priceUsdCents / 100).toFixed(2)}`);

  // **CRITICAL FIX - PRODUCTION BLOCKER**
  // Instant Rescue purchases MUST use real Stripe payment via create-instant-rescue-payment
  // Simulated payment is REMOVED - this is a production security issue
  
  return new Response(
    JSON.stringify({
      success: false,
      error: "STRIPE_PAYMENT_REQUIRED",
      message: "Instant Rescue purchases must use Stripe. Call create-instant-rescue-payment endpoint.",
      requiresStripeCheckout: true,
      boosterTypeId: boosterType.id
    }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
