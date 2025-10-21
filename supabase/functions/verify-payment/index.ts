import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

// Booster configurations
const BOOSTER_CONFIG = {
  DoubleSpeed: { multiplier: 2, maxLives: 25, livesBonus: 10 },
  MegaSpeed: { multiplier: 4, maxLives: 35, livesBonus: 20 },
  GigaSpeed: { multiplier: 12, maxLives: 75, livesBonus: 60 },
  DingleSpeed: { multiplier: 24, maxLives: 135, livesBonus: 120 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { sessionId } = await req.json();
    logStep("Session ID received", { sessionId });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { status: session.payment_status, metadata: session.metadata });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const productType = session.metadata?.product_type as keyof typeof BOOSTER_CONFIG;
    if (!productType || !BOOSTER_CONFIG[productType]) {
      throw new Error("Invalid product type in session metadata");
    }

    const config = BOOSTER_CONFIG[productType];

    // Check if purchase already recorded
    const { data: existingPurchase } = await supabaseClient
      .from("purchases")
      .select("id")
      .eq("stripe_payment_intent_id", session.payment_intent as string)
      .single();

    if (existingPurchase) {
      logStep("Purchase already recorded", { purchaseId: existingPurchase.id });
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get payment intent for additional details
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
    const charge = paymentIntent.latest_charge;

    // Record purchase in database
    const { error: purchaseError } = await supabaseClient
      .from("purchases")
      .insert({
        user_id: user.id,
        product_type: productType,
        payment_method: "stripe",
        amount_usd: session.amount_total ? session.amount_total / 100 : 0,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_charge_id: typeof charge === 'string' ? charge : charge?.id,
        country: session.customer_details?.address?.country || null,
        currency: session.currency,
        status: "completed",
        metadata: {
          session_id: sessionId,
          customer_email: session.customer_details?.email,
        },
      });

    if (purchaseError) {
      logStep("Error recording purchase", { error: purchaseError });
      throw purchaseError;
    }

    // Create booster in user_boosters table
    const { error: boosterError } = await supabaseClient
      .from("user_boosters")
      .insert({
        user_id: user.id,
        booster_type: productType,
        activated: false,
      });

    if (boosterError) {
      logStep("Error creating booster", { error: boosterError });
      throw boosterError;
    }

    logStep("Purchase and booster recorded successfully");

    return new Response(JSON.stringify({ 
      success: true,
      productType,
      livesBonus: config.livesBonus,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});