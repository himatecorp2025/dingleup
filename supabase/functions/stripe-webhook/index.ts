import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Event verified", { type: event.type, id: event.id });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle subscription events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer email
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as any).email;

        if (!email) {
          throw new Error("Customer email not found");
        }

        // Find user by email
        const { data: users, error: userError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', email)
          .limit(1);

        if (userError || !users || users.length === 0) {
          throw new Error(`User not found for email: ${email}`);
        }

        const userId = users[0].id;
        const isActive = subscription.status === 'active';
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        logStep("Processing subscription", { 
          userId, 
          subscriptionId: subscription.id, 
          status: subscription.status 
        });

        // Update profile
        await supabaseClient
          .from('profiles')
          .update({
            is_subscribed: isActive,
            subscriber_since: isActive ? new Date().toISOString() : null,
            subscriber_renew_at: isActive ? currentPeriodEnd.toISOString() : null,
            lives_regeneration_rate: isActive ? 6 : 12,
            max_lives: isActive ? 30 : 15
          })
          .eq('id', userId);

        // Upsert subscription record
        await supabaseClient
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            product_id: subscription.items.data[0].price.product as string,
            status: subscription.status,
            current_period_end: currentPeriodEnd.toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end || false
          }, {
            onConflict: 'stripe_subscription_id'
          });

        logStep("Subscription updated successfully");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get customer email
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as any).email;

        if (!email) {
          throw new Error("Customer email not found");
        }

        // Find user by email
        const { data: users, error: userError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', email)
          .limit(1);

        if (userError || !users || users.length === 0) {
          throw new Error(`User not found for email: ${email}`);
        }

        const userId = users[0].id;

        logStep("Processing subscription cancellation", { userId, subscriptionId: subscription.id });

        // Disable subscription
        await supabaseClient
          .from('profiles')
          .update({
            is_subscribed: false,
            subscriber_renew_at: null,
            lives_regeneration_rate: 12,
            max_lives: 15
          })
          .eq('id', userId);

        // Update subscription status
        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled'
          })
          .eq('stripe_subscription_id', subscription.id);

        logStep("Subscription canceled successfully");
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment succeeded", { invoiceId: invoice.id });
        // Additional logic if needed for successful payments
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", { invoiceId: invoice.id });
        // Could send notification to user here
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});