import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminBoosterPurchaseRow {
  id: string;
  userId: string;
  userDisplayName: string | null;
  boosterCode: string;
  boosterName: string;
  purchaseSource: 'GOLD' | 'IAP';
  goldSpent: number;
  usdCentsSpent: number;
  createdAt: string;
  iapTransactionId: string | null;
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

    // Parse query params for filtering
    const url = new URL(req.url);
    const boosterCode = url.searchParams.get("boosterCode");
    const source = url.searchParams.get("source");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build query
    let query = supabaseAdmin
      .from("booster_purchases")
      .select(`
        id,
        user_id,
        booster_type_id,
        purchase_source,
        gold_spent,
        usd_cents_spent,
        iap_transaction_id,
        created_at,
        booster_types:booster_type_id (
          code,
          name
        ),
        profiles:user_id (
          username
        )
      `)
      .order("created_at", { ascending: false });

    if (source) {
      query = query.eq("purchase_source", source);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: purchases, error: fetchError } = await query;

    if (fetchError) {
      console.error("[admin-booster-purchases] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Adatok lekérése sikertelen" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform data
    const response: AdminBoosterPurchaseRow[] = (purchases || []).map(p => ({
      id: p.id,
      userId: p.user_id,
      userDisplayName: (p.profiles as any)?.[0]?.username || null,
      boosterCode: (p.booster_types as any)?.[0]?.code || '',
      boosterName: (p.booster_types as any)?.[0]?.name || '',
      purchaseSource: p.purchase_source as 'GOLD' | 'IAP',
      goldSpent: p.gold_spent,
      usdCentsSpent: p.usd_cents_spent,
      createdAt: p.created_at,
      iapTransactionId: p.iap_transaction_id
    }));

    // Calculate summary stats
    const totalFreePurchases = response.filter(p => p.boosterCode === 'FREE').length;
    const totalPremiumPurchases = response.filter(p => p.boosterCode === 'PREMIUM').length;
    const totalGoldSpent = response.reduce((sum, p) => sum + p.goldSpent, 0);
    const totalUsdRevenue = response.reduce((sum, p) => sum + p.usdCentsSpent, 0) / 100;

    return new Response(
      JSON.stringify({
        purchases: response,
        summary: {
          totalFreePurchases,
          totalPremiumPurchases,
          totalGoldSpent,
          totalUsdRevenue
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[admin-booster-purchases] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Szerver hiba";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
