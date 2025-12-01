import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// ============= LOOTBOX HANDLER =============
async function handleLootboxWebhook(sessionId: string, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const boxes = parseInt(session.metadata?.boxes || '0');

  if (!userId || !boxes) {
    console.error('[webhook/lootbox] Missing metadata:', { userId, boxes });
    return;
  }

  // Call atomic RPC function (idempotent, bulk insert)
  const { data: result, error } = await supabaseAdmin
    .rpc('apply_lootbox_purchase_from_stripe', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_boxes: boxes
    });

  if (error) {
    console.error('[webhook/lootbox] RPC error:', error);
    throw error;
  }

  if (result?.already_processed) {
    console.log('[webhook/lootbox] Already processed:', sessionId);
  } else {
    console.log('[webhook/lootbox] Credited', boxes, 'boxes to user:', userId);
  }
}

// ============= SPEED BOOSTER HANDLER =============
async function handleSpeedBoosterWebhook(sessionId: string, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  
  if (!userId) {
    console.error('[webhook/speed] Missing user_id in metadata');
    return;
  }

  // Call atomic RPC function
  const payload = {
    speed_token_count: session.metadata?.speed_token_count,
    speed_duration_min: session.metadata?.speed_duration_min,
    gold_reward: session.metadata?.gold_reward,
    lives_reward: session.metadata?.lives_reward,
    price_usd_cents: session.amount_total,
    purchase_source: 'speed_boost_shop',
    token_source: 'purchase'
  };

  const { data: result, error } = await supabaseAdmin
    .rpc('apply_booster_purchase_from_stripe', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_booster_code: 'SPEED_BOOST',
      p_payload: payload
    });

  if (error) {
    console.error('[webhook/speed] RPC error:', error);
    throw error;
  }

  if (result?.already_processed) {
    console.log('[webhook/speed] Already processed:', sessionId);
  } else {
    console.log('[webhook/speed] Success! User:', userId, 'Tokens:', result?.speed_tokens_granted);
  }
}

// ============= PREMIUM BOOSTER HANDLER =============
async function handlePremiumBoosterWebhook(sessionId: string, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  
  if (!userId) {
    console.error('[webhook/premium] Missing user_id in metadata');
    return;
  }

  // Get booster definition (for default values if metadata missing)
  const { data: boosterType } = await supabaseAdmin
    .from('booster_types')
    .select('*')
    .eq('code', 'PREMIUM')
    .single();

  if (!boosterType) {
    console.error('[webhook/premium] Booster type not found');
    return;
  }

  // Call atomic RPC function
  const payload = {
    gold_reward: boosterType.reward_gold || 0,
    lives_reward: boosterType.reward_lives || 0,
    speed_token_count: boosterType.reward_speed_count || 0,
    speed_duration_min: boosterType.reward_speed_duration_min || 0,
    price_usd_cents: 249,
    purchase_source: 'stripe_checkout',
    token_source: 'PREMIUM_BOOSTER'
  };

  const { data: result, error } = await supabaseAdmin
    .rpc('apply_booster_purchase_from_stripe', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_booster_code: 'PREMIUM',
      p_payload: payload
    });

  if (error) {
    console.error('[webhook/premium] RPC error:', error);
    throw error;
  }

  if (result?.already_processed) {
    console.log('[webhook/premium] Already processed:', sessionId);
  } else {
    console.log('[webhook/premium] Success! User:', userId, 'Gold:', result?.gold_granted, 'Lives:', result?.lives_granted);
  }
}

// ============= INSTANT RESCUE HANDLER =============
async function handleInstantRescueWebhook(sessionId: string, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  
  if (!userId) {
    console.error('[webhook/rescue] Missing user_id in metadata');
    return;
  }

  // Call atomic RPC function
  const payload = {
    booster_type_id: session.metadata?.booster_type_id,
    gold_reward: session.metadata?.gold_reward,
    lives_reward: session.metadata?.lives_reward,
    price_usd_cents: session.amount_total
  };

  const gameSessionId = session.metadata?.game_session_id || null;

  const { data: result, error } = await supabaseAdmin
    .rpc('apply_instant_rescue_from_stripe', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_game_session_id: gameSessionId,
      p_payload: payload
    });

  if (error) {
    console.error('[webhook/rescue] RPC error:', error);
    throw error;
  }

  if (result?.already_processed) {
    console.log('[webhook/rescue] Already processed:', sessionId);
  } else {
    console.log('[webhook/rescue] Success! User:', userId, 'Gold:', result?.gold_granted, 'Lives:', result?.lives_granted);
  }
}

// ============= MAIN WEBHOOK HANDLER =============
serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: "Webhook not configured" }), { status: 500 });
  }

  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }
  
  console.log('[webhook] Event received:', event.type, 'ID:', event.id);
  
  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    const paymentStatus = session.payment_status;
    
    console.log('[webhook] Session:', sessionId, 'Payment status:', paymentStatus);
    
    if (paymentStatus !== "paid") {
      console.log('[webhook] Payment not completed, skipping');
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }
    
    // Route based on product_type metadata
    const productType = session.metadata?.product_type;
    console.log('[webhook] Product type:', productType);
    
    try {
      switch (productType) {
        case "lootbox":
          await handleLootboxWebhook(sessionId, session);
          break;
        case "speed_booster":
          await handleSpeedBoosterWebhook(sessionId, session);
          break;
        case "premium_booster":
          await handlePremiumBoosterWebhook(sessionId, session);
          break;
        case "instant_rescue":
          await handleInstantRescueWebhook(sessionId, session);
          break;
        default:
          console.error('[webhook] Unknown product type:', productType);
      }
    } catch (error) {
      console.error('[webhook] Handler error:', error);
      // Still return 200 to Stripe to prevent retries for handler errors
    }
  }
  
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
