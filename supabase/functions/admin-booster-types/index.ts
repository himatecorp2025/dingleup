import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminBoosterType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priceGold: number | null;
  priceUsdCents: number | null;
  rewardGold: number;
  rewardLives: number;
  rewardSpeedCount: number;
  rewardSpeedDurationMin: number;
  createdAt: string;
  updatedAt: string;
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
        JSON.stringify({ error: "Hiányzó autentikáció" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Érvénytelen autentikáció" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Nincs admin jogosultságod" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all booster types
    const { data: boosterTypes, error: fetchError } = await supabaseAdmin
      .from("booster_types")
      .select("*")
      .order("code");

    if (fetchError) {
      console.error("[admin-booster-types] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Adatok lekérése sikertelen" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response: AdminBoosterType[] = (boosterTypes || []).map(bt => ({
      id: bt.id,
      code: bt.code,
      name: bt.name,
      description: bt.description,
      isActive: bt.is_active,
      priceGold: bt.price_gold,
      priceUsdCents: bt.price_usd_cents,
      rewardGold: bt.reward_gold,
      rewardLives: bt.reward_lives,
      rewardSpeedCount: bt.reward_speed_count,
      rewardSpeedDurationMin: bt.reward_speed_duration_min,
      createdAt: bt.created_at,
      updatedAt: bt.updated_at
    }));

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[admin-booster-types] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Szerver hiba";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
