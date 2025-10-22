import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-INLINE-PAYMENT] ${step}${detailsStr}`);
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

    const { paymentIntentId } = await req.json();
    
    if (!paymentIntentId || typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
      throw new Error('Invalid payment intent ID format');
    }
    
    logStep("Payment Intent ID received", { paymentIntentId });

    const authHeader = req.headers.get("Authorization")!;
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

    // Record purchase
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
      logStep("Error recording purchase", { error: purchaseError });
      throw purchaseError;
    }

    // Award coins
    await supabaseClient.rpc('award_coins', { amount: coins });
    
    // Award lives
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('lives, max_lives')
      .eq('id', user.id)
      .single();

    if (profile) {
      const newLives = Math.min(profile.lives + lives, profile.max_lives);
      await supabaseClient
        .from('profiles')
        .update({ lives: newLives })
        .eq('id', user.id);
      
      logStep('Lives awarded', { oldLives: profile.lives, newLives, added: lives });
    }

    logStep('Inline purchase completed successfully', { coins, lives });
    
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
