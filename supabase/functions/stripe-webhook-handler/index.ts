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

  // Idempotency check
  const { data: existingLootboxes } = await supabaseAdmin
    .from('lootbox_instances')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'purchase')
    .eq('metadata->>session_id', sessionId)
    .limit(1);

  if (existingLootboxes && existingLootboxes.length > 0) {
    console.log('[webhook/lootbox] Already processed:', sessionId);
    return;
  }

  // Credit lootboxes
  const insertPromises = [];
  for (let i = 0; i < boxes; i++) {
    insertPromises.push(
      supabaseAdmin.from('lootbox_instances').insert({
        user_id: userId,
        status: 'stored',
        source: 'purchase',
        open_cost_gold: 150,
        metadata: {
          session_id: sessionId,
          purchased_at: new Date().toISOString(),
          credited_via: 'webhook'
        }
      })
    );
  }

  await Promise.all(insertPromises);
  console.log('[webhook/lootbox] Credited', boxes, 'boxes to user:', userId);
}

// ============= SPEED BOOSTER HANDLER =============
async function handleSpeedBoosterWebhook(sessionId: string, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  
  if (!userId) {
    console.error('[webhook/speed] Missing user_id in metadata');
    return;
  }

  // Idempotency check
  const { data: existingPurchase } = await supabaseAdmin
    .from('booster_purchases')
    .select('id')
    .eq('iap_transaction_id', sessionId)
    .single();

  if (existingPurchase) {
    console.log('[webhook/speed] Already processed:', sessionId);
    return;
  }

  const speedTokenCount = parseInt(session.metadata?.speed_token_count || '1');
  const speedDurationMin = parseInt(session.metadata?.speed_duration_min || '10');
  const goldReward = parseInt(session.metadata?.gold_reward || '0');
  const livesReward = parseInt(session.metadata?.lives_reward || '0');
  const priceUsdCents = session.amount_total || 0;

  // Get or create booster_type
  let { data: boosterType } = await supabaseAdmin
    .from('booster_types')
    .select('id')
    .eq('code', 'SPEED_BOOST')
    .single();

  if (!boosterType) {
    const { data: newBoosterType } = await supabaseAdmin
      .from('booster_types')
      .insert({
        code: 'SPEED_BOOST',
        name: 'GigaSpeed',
        description: 'Speed boost purchase',
        price_usd_cents: priceUsdCents,
        reward_gold: goldReward,
        reward_lives: livesReward,
        reward_speed_count: speedTokenCount,
        reward_speed_duration_min: speedDurationMin,
        is_active: true
      })
      .select('id')
      .single();
    boosterType = newBoosterType;
  }

  // Record purchase
  await supabaseAdmin.from('booster_purchases').insert({
    user_id: userId,
    booster_type_id: boosterType!.id,
    purchase_source: 'speed_boost_shop',
    purchase_context: 'webhook_credit',
    usd_cents_spent: priceUsdCents,
    gold_spent: 0,
    iap_transaction_id: sessionId
  });

  // Credit gold/lives
  if (goldReward > 0 || livesReward > 0) {
    const idempotencyKey = `speed-boost-webhook:${sessionId}`;
    await supabaseAdmin.from('wallet_ledger').insert({
      user_id: userId,
      delta_coins: goldReward,
      delta_lives: livesReward,
      source: 'speed_boost_purchase',
      idempotency_key: idempotencyKey,
      metadata: { session_id: sessionId, credited_via: 'webhook' }
    });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('coins, lives')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabaseAdmin.from('profiles').update({
        coins: (profile.coins || 0) + goldReward,
        lives: (profile.lives || 0) + livesReward
      }).eq('id', userId);
    }
  }

  // Create speed tokens
  const speedTokenInserts = [];
  for (let i = 0; i < speedTokenCount; i++) {
    speedTokenInserts.push({
      user_id: userId,
      duration_minutes: speedDurationMin,
      source: 'purchase',
      metadata: { session_id: sessionId, purchased_at: new Date().toISOString() }
    });
  }
  await supabaseAdmin.from('speed_tokens').insert(speedTokenInserts);

  console.log('[webhook/speed] Credited', speedTokenCount, 'tokens to user:', userId);
}

// ============= PREMIUM BOOSTER HANDLER =============
async function handlePremiumBoosterWebhook(sessionId: string, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  
  if (!userId) {
    console.error('[webhook/premium] Missing user_id in metadata');
    return;
  }

  // Idempotency check
  const { data: existingPurchase } = await supabaseAdmin
    .from('booster_purchases')
    .select('id')
    .eq('iap_transaction_id', sessionId)
    .single();

  if (existingPurchase) {
    console.log('[webhook/premium] Already processed:', sessionId);
    return;
  }

  // Get booster definition
  const { data: boosterType } = await supabaseAdmin
    .from('booster_types')
    .select('*')
    .eq('code', 'PREMIUM')
    .single();

  if (!boosterType) {
    console.error('[webhook/premium] Booster type not found');
    return;
  }

  const rewardGold = boosterType.reward_gold || 0;
  const rewardLives = boosterType.reward_lives || 0;

  // Get current balance
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('coins, lives')
    .eq('id', userId)
    .single();

  const currentGold = profile?.coins || 0;
  const currentLives = profile?.lives || 0;

  // Update balances
  await supabaseAdmin.from('profiles').update({
    coins: currentGold + rewardGold,
    lives: currentLives + rewardLives,
    updated_at: new Date().toISOString()
  }).eq('id', userId);

  // Log to wallet_ledger
  await supabaseAdmin.from('wallet_ledger').insert({
    user_id: userId,
    delta_coins: rewardGold,
    delta_lives: rewardLives,
    source: 'booster_purchase',
    idempotency_key: `premium_booster_webhook:${sessionId}`,
    metadata: {
      booster_code: 'PREMIUM',
      stripe_session_id: sessionId,
      credited_via: 'webhook'
    }
  });

  // Log purchase
  await supabaseAdmin.from('booster_purchases').insert({
    user_id: userId,
    booster_type_id: boosterType.id,
    purchase_source: 'stripe_checkout',
    usd_cents_spent: 249,
    gold_spent: 0,
    iap_transaction_id: sessionId
  });

  // Create speed tokens (pending activation)
  const rewardSpeedCount = boosterType.reward_speed_count || 0;
  const rewardSpeedDuration = boosterType.reward_speed_duration_min || 0;

  if (rewardSpeedCount > 0) {
    const speedTokens = [];
    for (let i = 0; i < rewardSpeedCount; i++) {
      speedTokens.push({
        user_id: userId,
        duration_minutes: rewardSpeedDuration,
        source: 'PREMIUM_BOOSTER'
      });
    }
    await supabaseAdmin.from('speed_tokens').insert(speedTokens);
  }

  // Set pending premium flag
  await supabaseAdmin.from('user_premium_booster_state').upsert({
    user_id: userId,
    has_pending_premium_booster: true,
    updated_at: new Date().toISOString()
  });

  console.log('[webhook/premium] Success! User', userId, 'received +', rewardGold, 'gold, +', rewardLives, 'lives');
}

// ============= INSTANT RESCUE HANDLER =============
async function handleInstantRescueWebhook(sessionId: string, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  
  if (!userId) {
    console.error('[webhook/rescue] Missing user_id in metadata');
    return;
  }

  // Idempotency check
  const { data: existingPurchase } = await supabaseAdmin
    .from('booster_purchases')
    .select('id')
    .eq('iap_transaction_id', sessionId)
    .single();

  if (existingPurchase) {
    console.log('[webhook/rescue] Already processed:', sessionId);
    return;
  }

  const boosterTypeId = session.metadata?.booster_type_id;
  const goldReward = parseInt(session.metadata?.gold_reward || '0');
  const livesReward = parseInt(session.metadata?.lives_reward || '0');
  const priceUsdCents = session.amount_total || 0;

  // Record purchase
  await supabaseAdmin.from('booster_purchases').insert({
    user_id: userId,
    booster_type_id: boosterTypeId,
    purchase_source: 'instant_rescue',
    purchase_context: 'in_game_rescue_webhook',
    usd_cents_spent: priceUsdCents,
    gold_spent: 0,
    iap_transaction_id: sessionId
  });

  // Credit gold/lives
  const idempotencyKey = `instant-rescue-webhook:${sessionId}`;
  await supabaseAdmin.from('wallet_ledger').insert({
    user_id: userId,
    delta_coins: goldReward,
    delta_lives: livesReward,
    source: 'instant_rescue_purchase',
    idempotency_key: idempotencyKey,
    metadata: { session_id: sessionId, credited_via: 'webhook' }
  });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('coins, lives')
    .eq('id', userId)
    .single();

  if (profile) {
    await supabaseAdmin.from('profiles').update({
      coins: (profile.coins || 0) + goldReward,
      lives: (profile.lives || 0) + livesReward
    }).eq('id', userId);
  }

  console.log('[webhook/rescue] Credited rewards to user:', userId);
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
