import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BoosterPurchaseRequest {
  boosterCode: 'FREE' | 'PREMIUM';
  confirmInstantPurchase?: boolean;
}

interface BoosterPurchaseResponse {
  success: boolean;
  error?: string;
  balanceAfter?: {
    gold: number;
    lives: number;
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
        JSON.stringify({ success: false, error: "Hiányzó autentikáció" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Érvénytelen autentikáció" }),
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
        JSON.stringify({ success: false, error: "Érvénytelen booster típus" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (boosterCode === 'FREE') {
      // FREE BOOSTER LOGIC
      return await handleFreeBoosterPurchase(supabaseAdmin, userId, boosterType);
    } else if (boosterCode === 'PREMIUM') {
      // PREMIUM BOOSTER LOGIC
      return await handlePremiumBoosterPurchase(supabaseAdmin, userId, boosterType, confirmInstantPurchase);
    }

    return new Response(
      JSON.stringify({ success: false, error: "Ismeretlen booster kód" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[purchase-booster] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Szerver hiba";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
      JSON.stringify({ success: false, error: "Profil nem található" }),
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
      JSON.stringify({ success: false, error: "Profil frissítési hiba" }),
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
      source: "free_booster",
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
      usd_cents_spent: 0
    });

  if (purchaseError) {
    console.error("[FREE] Purchase log error:", purchaseError);
  }

  // Create Speed tokens
  console.log(`[FREE] Creating ${rewardSpeedCount} Speed tokens of ${rewardSpeedDuration} minutes each`);
  
  const speedTokens = [];
  for (let i = 0; i < rewardSpeedCount; i++) {
    speedTokens.push({
      user_id: userId,
      duration_minutes: rewardSpeedDuration,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
      source: 'FREE_BOOSTER'
    });
  }

  const { error: speedError } = await supabaseAdmin
    .from("speed_tokens")
    .insert(speedTokens);

  if (speedError) {
    console.error("[FREE] Speed tokens creation error:", speedError);
  } else {
    console.log(`[FREE] Successfully created ${rewardSpeedCount} Speed tokens`);
  }

  const response: BoosterPurchaseResponse = {
    success: true,
    balanceAfter: {
      gold: newGold,
      lives: newLives
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

    // ========== PAYMENT SIMULATION ==========
    // TODO: Replace with real Stripe payment integration
    // For now, simulate payment (90% success rate for testing)
    const paymentSuccess = Math.random() > 0.1; // 90% success rate
    
    if (!paymentSuccess) {
      console.log('[PREMIUM] Simulated payment failure');
      return new Response(
        JSON.stringify({
          success: false,
          error: "PAYMENT_FAILED",
          instantPremiumBoosterEnabled: instantEnabled || confirmInstantPurchase,
          hasPendingPremiumBooster: false
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log('[PREMIUM] Simulated payment success');
    // ========== END PAYMENT SIMULATION ==========

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
        JSON.stringify({ success: false, error: "Profil frissítési hiba" }),
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
        source: "premium_booster",
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
        iap_transaction_id: `stripe_${Date.now()}` // TODO: Replace with real Stripe transaction ID
      });

    console.log(`[PREMIUM] Purchase successful, pending activation`);

    const response: BoosterPurchaseResponse = {
      success: true,
      balanceAfter: {
        gold: newGold,
        lives: newLives
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
      JSON.stringify({ success: false, error: "Tranzakciós hiba történt" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
