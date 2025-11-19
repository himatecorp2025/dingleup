import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivatePremiumSpeedResponse {
  success: boolean;
  error?: string;
  activeSpeedToken?: {
    id: string;
    expiresAt: string;
    durationMinutes: number;
    source: string;
  };
  hasPendingPremiumBooster?: boolean;
  balanceAfter?: {
    lives: number;
    coins: number;
  };
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

    console.log(`[activate-premium-speed] User ${userId} activating premium speed`);

    // Check if user has pending premium booster
    const { data: boosterState, error: stateError } = await supabaseAdmin
      .from("user_premium_booster_state")
      .select("has_pending_premium_booster, last_premium_purchase_at")
      .eq("user_id", userId)
      .single();

    if (stateError || !boosterState) {
      // No state record exists
      return new Response(
        JSON.stringify({
          success: false,
          error: "NO_PENDING_PREMIUM",
          hasPendingPremiumBooster: false
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!boosterState.has_pending_premium_booster) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "NO_PENDING_PREMIUM",
          hasPendingPremiumBooster: false
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Premium booster definition
    const { data: boosterType, error: boosterError } = await supabaseAdmin
      .from("booster_types")
      .select("*")
      .eq("code", "PREMIUM")
      .eq("is_active", true)
      .single();

    if (boosterError || !boosterType) {
      return new Response(
        JSON.stringify({ success: false, error: "Premium booster definíció nem található" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const speedCount = boosterType.reward_speed_count || 0;
    const speedDuration = boosterType.reward_speed_duration_min || 0;

    console.log(`[activate-premium-speed] Activating ${speedCount}x ${speedDuration}min Speed tokens`);

    // Create Speed tokens
    const speedTokens = [];
    for (let i = 0; i < speedCount; i++) {
      speedTokens.push({
        user_id: userId,
        duration_minutes: speedDuration,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        source: 'PREMIUM_BOOSTER'
      });
    }

    const { error: speedError } = await supabaseAdmin
      .from("speed_tokens")
      .insert(speedTokens);

    if (speedError) {
      console.error("[activate-premium-speed] Speed tokens creation error:", speedError);
      return new Response(
        JSON.stringify({ success: false, error: "Speed token létrehozási hiba" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[activate-premium-speed] Successfully created ${speedCount} Speed tokens`);

    // Clear pending flag
    const { error: clearError } = await supabaseAdmin
      .from("user_premium_booster_state")
      .update({
        has_pending_premium_booster: false,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (clearError) {
      console.error("[activate-premium-speed] Error clearing pending flag:", clearError);
      return new Response(
        JSON.stringify({ success: false, error: "Állapot frissítési hiba" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current balance for response
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("coins, lives")
      .eq("id", userId)
      .single();

    const currentGold = profile?.coins || 0;
    const currentLives = profile?.lives || 0;

    const response: ActivatePremiumSpeedResponse = {
      success: true,
      balanceAfter: {
        coins: currentGold,
        lives: currentLives
      },
      hasPendingPremiumBooster: false
    };

    console.log(`[activate-premium-speed] Activation successful`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[activate-premium-speed] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Szerver hiba";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
