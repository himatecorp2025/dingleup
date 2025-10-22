import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-EXPIRY-NOTIFICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Verify this is a legitimate cron request
    const userAgent = req.headers.get('user-agent') || '';
    const isCronRequest = userAgent.includes('Deno') || userAgent.includes('Supabase');
    
    if (!isCronRequest) {
      console.warn('[SECURITY] Unauthorized access attempt to cron endpoint');
      return new Response(
        JSON.stringify({ error: 'This endpoint is for scheduled tasks only' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    logStep("Starting subscription expiry notification check");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    logStep("Found active subscriptions", { count: subscriptions.data.length });

    const now = Math.floor(Date.now() / 1000);
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60);

    let notificationsSent = 0;

    for (const subscription of subscriptions.data) {
      const periodEnd = subscription.current_period_end;
      
      // Check if subscription expires in exactly 7 days (within a 1-hour window)
      if (periodEnd >= now + (6 * 24 * 60 * 60 + 23 * 60 * 60) && 
          periodEnd <= sevenDaysFromNow) {
        
        logStep("Found subscription expiring in 7 days", { 
          subscriptionId: subscription.id,
          periodEnd: new Date(periodEnd * 1000).toISOString()
        });

        // Get customer details
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('email' in customer && customer.email) {
          const expiryDate = new Date(periodEnd * 1000).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          try {
            await resend.emails.send({
              from: "Milliomos Kvíz <onboarding@resend.dev>",
              to: [customer.email],
              subject: "⚠️ Prémium előfizetésed hamarosan lejár!",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #FFD700;">🏆 Milliomos Kvíz</h1>
                  
                  <h2 style="color: #333;">Prémium előfizetésed hamarosan lejár!</h2>
                  
                  <p style="font-size: 16px; line-height: 1.6; color: #555;">
                    Szia! 👋
                  </p>
                  
                  <p style="font-size: 16px; line-height: 1.6; color: #555;">
                    Szeretnénk emlékeztetni, hogy a <strong>Prémium előfizetésed ${expiryDate}-án lejár</strong>.
                  </p>
                  
                  <div style="background-color: #FFF9E6; border-left: 4px solid #FFD700; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">🎁 Prémium előfizetésed előnyei:</h3>
                    <ul style="color: #555;">
                      <li>Dupla napi jutalmak (100 aranyérme helyett 200)</li>
                      <li>30 élet a szokásos 15 helyett</li>
                      <li>Prioritásos támogatás</li>
                      <li>Exkluzív játékmódok</li>
                    </ul>
                  </div>
                  
                  <p style="font-size: 16px; line-height: 1.6; color: #555;">
                    Ne hagyd, hogy bónuszaid lejárjanak! Az előfizetésed automatikusan megújul, így tovább élvezheted a prémium előnyöket.
                  </p>
                  
                  <p style="font-size: 14px; line-height: 1.6; color: #888; margin-top: 30px;">
                    Ha mégsem szeretnéd folytatni az előfizetést, bármikor lemondhatod a fiókodban.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                  
                  <p style="font-size: 12px; color: #888; text-align: center;">
                    Milliomos Kvíz - Teszteld a tudásod! 🎯
                  </p>
                </div>
              `,
            });

            logStep("Notification email sent successfully", { 
              email: customer.email,
              subscriptionId: subscription.id 
            });
            
            notificationsSent++;
          } catch (emailError) {
            logStep("Error sending email", { 
              error: emailError,
              email: customer.email 
            });
          }
        }
      }
    }

    logStep("Notification process completed", { 
      totalSubscriptions: subscriptions.data.length,
      notificationsSent 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        checkedSubscriptions: subscriptions.data.length,
        notificationsSent 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logStep("Error in subscription expiry notification", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
