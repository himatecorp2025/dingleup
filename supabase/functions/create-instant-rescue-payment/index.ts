import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log('[create-instant-rescue-payment] Request received');

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      console.error('[create-instant-rescue-payment] User not authenticated');
      throw new Error("User not authenticated or email not available");
    }

    console.log('[create-instant-rescue-payment] User:', user.id, user.email);

    // Get game_session_id from request body
    const { gameSessionId } = await req.json();
    if (!gameSessionId) {
      console.error('[create-instant-rescue-payment] Missing gameSessionId');
      throw new Error('Game session ID required');
    }

    console.log('[create-instant-rescue-payment] Game session:', gameSessionId);

    // Get INSTANT_RESCUE booster details
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: boosterType, error: boosterError } = await supabaseAdmin
      .from('booster_types')
      .select('*')
      .eq('code', 'INSTANT_RESCUE')
      .eq('is_active', true)
      .single();

    if (boosterError || !boosterType) {
      console.error('[create-instant-rescue-payment] Booster type not found:', boosterError);
      throw new Error('INSTANT_RESCUE booster not found or inactive');
    }

    const priceUsdCents = boosterType.price_usd_cents || 299; // $2.99 default
    console.log('[create-instant-rescue-payment] Price:', priceUsdCents, 'cents');

    // **DUPLICATE RESCUE CHECK** - prevent multiple rescue attempts for same session
    const { data: existingSession, error: sessionError } = await supabaseAdmin
      .from('game_sessions')
      .select('pending_rescue, pending_rescue_session_id')
      .eq('id', gameSessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError) {
      console.error('[create-instant-rescue-payment] Game session not found:', sessionError);
      throw new Error('Game session not found');
    }

    if (existingSession.pending_rescue && existingSession.pending_rescue_session_id) {
      console.log('[create-instant-rescue-payment] Rescue already pending for session:', existingSession.pending_rescue_session_id);
      throw new Error('Rescue payment already pending for this game session');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('[create-instant-rescue-payment] Existing customer:', customerId);
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: boosterType.name,
              description: boosterType.description || 'Instant Rescue - Get back in the game immediately!',
            },
            unit_amount: priceUsdCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard`,
      metadata: {
        product_type: 'instant_rescue', // WEBHOOK ROUTING
        user_id: user.id,
        game_session_id: gameSessionId,
        booster_type_id: boosterType.id,
        booster_code: 'INSTANT_RESCUE',
        gold_reward: boosterType.reward_gold.toString(),
        lives_reward: boosterType.reward_lives.toString(),
      },
    });

    console.log('[create-instant-rescue-payment] Session created:', session.id);

    // Mark game session as pending rescue
    await supabaseAdmin
      .from('game_sessions')
      .update({
        pending_rescue: true,
        pending_rescue_session_id: session.id
      })
      .eq('id', gameSessionId);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('[create-instant-rescue-payment] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
