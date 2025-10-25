import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

// Price IDs for speed boosters
const PRICE_IDS = {
  DoubleSpeed: "price_1SKlwuKKw7HPC0ZD8LJdSYwB",
  MegaSpeed: "price_1SKlxTKKw7HPC0ZDIzwqVytC",
  GigaSpeed: "price_1SKlxnKKw7HPC0ZDuzpqxiIK",
  DingleSpeed: "price_1SKly0KKw7HPC0ZDr8V222w6",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { productType } = await req.json();
    
    // Validate productType against whitelist
    if (!productType || typeof productType !== 'string') {
      throw new Error("Product type is required");
    }
    
    const allowedProducts = Object.keys(PRICE_IDS);
    if (!allowedProducts.includes(productType)) {
      throw new Error(`Invalid product type. Allowed: ${allowedProducts.join(', ')}`);
    }
    
    logStep("Product type requested", { productType });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: PRICE_IDS[productType as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/shop?payment=success&product=${productType}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/shop?payment=cancelled`,
      metadata: {
        user_id: user.id,
        product_type: productType,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('[INTERNAL] Error in create-payment:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Hiba történt a fizetés indításakor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});