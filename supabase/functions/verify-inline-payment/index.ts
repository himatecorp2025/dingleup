import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-INLINE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { paymentIntentId } = await req.json();
    
    // SECURITY: Strict input validation
    if (!paymentIntentId || typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
      logStep("Invalid payment intent ID format", { received: paymentIntentId });
      return new Response(JSON.stringify({ 
        granted: false, 
        error: 'Invalid payment intent ID format' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // SECURITY: Limit payment intent ID length (prevent injection)
    if (paymentIntentId.length > 100) {
      logStep("Payment intent ID too long", { length: paymentIntentId.length });
      return new Response(JSON.stringify({ 
        granted: false, 
        error: 'Invalid payment intent ID' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    logStep("Payment Intent ID validated", { paymentIntentId });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ granted: false, error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    logStep("PaymentIntent retrieved", { status: paymentIntent.status });

    if (paymentIntent.status !== "succeeded") {
      return new Response(JSON.stringify({ 
        granted: false, 
        status: paymentIntent.status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if purchase already recorded (idempotency)
    const { data: existingPurchase } = await supabaseClient
      .from("purchases")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    if (existingPurchase) {
      logStep("Purchase already recorded", { purchaseId: existingPurchase.id });
      return new Response(JSON.stringify({ 
        granted: true, 
        alreadyProcessed: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const coins = parseInt(paymentIntent.metadata?.coins || '500');
    const lives = parseInt(paymentIntent.metadata?.lives || '15');

    // Use credit_wallet for idempotent operation
    const { data: creditResult, error: creditError } = await supabaseClient.rpc('credit_wallet', {
      p_user_id: user.id,
      p_delta_coins: coins,
      p_delta_lives: lives,
      p_source: 'purchase',
      p_idempotency_key: `pi_${paymentIntentId}`,
      p_metadata: {
        payment_intent_id: paymentIntentId,
        amount_usd: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      }
    });

    if (creditError) {
      logStep("Error crediting wallet", { error: creditError });
      throw creditError;
    }

    if (creditResult.already_processed) {
      logStep("Purchase already processed via credit_wallet", { paymentIntentId });
      return new Response(JSON.stringify({ 
        granted: true, 
        coins,
        lives,
        alreadyProcessed: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Record purchase for tracking
    const { error: purchaseError } = await supabaseClient
      .from('purchases')
      .insert({
        user_id: user.id,
        product_type: 'InGamePackage',
        product_name: 'Játékon Belüli Azonnali Csomag',
        amount_usd: paymentIntent.amount / 100,
        amount_coins: coins,
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntentId,
        stripe_charge_id: typeof paymentIntent.latest_charge === 'string' 
          ? paymentIntent.latest_charge 
          : paymentIntent.latest_charge?.id,
        currency: paymentIntent.currency,
        status: 'completed',
        metadata: {
          coins,
          lives,
          payment_intent_id: paymentIntentId,
        }
      });

    if (purchaseError) {
      logStep("Error recording purchase (non-critical)", { error: purchaseError });
      // Don't throw - wallet already credited, this is just for tracking
    }

    logStep('Inline purchase completed successfully', { coins, lives, newCoins: creditResult.new_coins, newLives: creditResult.new_lives });
    
    return new Response(JSON.stringify({ 
      granted: true,
      coins,
      lives,
      message: `${coins} aranyérme és ${lives} élet hozzáadva!`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-inline-payment", { message: errorMessage });
    return new Response(JSON.stringify({ 
      granted: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
