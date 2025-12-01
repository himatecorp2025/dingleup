import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitExceeded } from '../_shared/rateLimit.ts';
import { startMetrics, measureStage, incDbQuery, logSuccess, logError } from '../_shared/metrics.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const correlationId = crypto.randomUUID();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const ctx = startMetrics({ functionName: 'verify-lootbox-payment', userId: user.id });
    ctx.extra['correlation_id'] = correlationId;

    // Rate limiting
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );
    const rateLimitResult = await measureStage(ctx, 'rate_limit', async () => {
      return await checkRateLimit(authClient, 'verify-lootbox-payment', { maxRequests: 15, windowMinutes: 1 });
    });
    if (!rateLimitResult.allowed) {
      logError(ctx, new Error('RATE_LIMIT_EXCEEDED'), { correlation_id: correlationId });
      return rateLimitExceeded(corsHeaders);
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // SECURITY: Validate session ID format
    if (!/^cs_/.test(sessionId)) {
      return new Response(JSON.stringify({ error: "Invalid session ID format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve session
    const session = await measureStage(ctx, 'stripe_retrieve', async () => {
      return await stripe.checkout.sessions.retrieve(sessionId);
    });

    // SECURITY: Check session expiry (24 hours)
    const sessionAge = Date.now() - (session.created * 1000);
    if (sessionAge > 24 * 60 * 60 * 1000) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Session expired' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payment not completed' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Extract metadata
    const boxes = parseInt(session.metadata?.boxes || '0');
    const userId = session.metadata?.user_id;

    if (!userId || userId !== user.id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User mismatch' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // **WEBHOOK-FIRST IDEMPOTENCY CHECK** - check if webhook already processed
    const { data: existingLootboxes } = await measureStage(ctx, 'idempotency_check', async () => {
      incDbQuery(ctx, 2);
      return await supabaseAdmin
        .from('lootbox_instances')
        .select('id')
        .eq('iap_transaction_id', sessionId)
        .limit(1);
    });

    if (existingLootboxes && existingLootboxes.length > 0) {
      const { count } = await supabaseAdmin
        .from('lootbox_instances')
        .select('*', { count: 'exact', head: true })
        .eq('iap_transaction_id', sessionId);
      
      logSuccess(ctx, { 
        correlation_id: correlationId,
        already_processed: true, 
        boxes_credited: count || boxes, 
        sessionId 
      });
      
      return new Response(JSON.stringify({ 
        success: true,
        already_processed: true,
        boxes_credited: count || boxes,
        message: 'Lootboxes already credited for this session',
        correlation_id: correlationId
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ============================================================
    // FALLBACK: Webhook hasn't processed yet → call atomic RPC
    // ============================================================
    const { data: result, error: rpcError } = await measureStage(ctx, 'rpc_fallback', async () => {
      incDbQuery(ctx);
      return await supabaseAdmin
        .rpc('apply_lootbox_purchase_from_stripe', {
          p_user_id: userId,
          p_session_id: sessionId,
          p_boxes: boxes
        });
    });

    if (rpcError) {
      logError(ctx, rpcError, { correlation_id: correlationId, sessionId, boxes });
      throw rpcError;
    }

    logSuccess(ctx, { 
      correlation_id: correlationId, 
      sessionId, 
      boxes_credited: result?.boxes_credited || boxes,
      fallback_used: true 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      boxes_credited: result?.boxes_credited || boxes,
      correlation_id: correlationId,
      performance: {
        elapsed_ms: Date.now() - ctx.startTime
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const ctx = startMetrics({ functionName: 'verify-lootbox-payment', userId: undefined });
    logError(ctx, error, { correlation_id: correlationId });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, correlation_id: correlationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
