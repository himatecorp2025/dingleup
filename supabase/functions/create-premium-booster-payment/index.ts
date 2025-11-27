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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // SECURITY: Rate limiting - max 5 payment attempts per minute
    const rateLimitResult = await checkRateLimit(supabaseClient, 'create-premium-booster-payment', { maxRequests: 5, windowMinutes: 1 });
    if (!rateLimitResult.allowed) {
      return rateLimitExceeded(corsHeaders);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Checkout session for Premium Booster (2.49 USD one-time payment)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 249, // 2.49 USD in cents
            product_data: {
              name: "Premium Speed Booster",
              description: "+1500 Arany, +50 Élet, +5× 30 perces Speed gyorsítás",
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?canceled=true`,
      metadata: {
        product_type: 'premium_booster', // WEBHOOK ROUTING
        user_id: user.id,
        booster_code: "PREMIUM",
      },
    });

    console.log(`[create-premium-booster-payment] Checkout session created for user ${user.id}`);

    // Return session info for localStorage tracking (Mobile WebView fallback)
    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-premium-booster-payment] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
