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
    const session = await stripe.checkout.sessions.retrieve(sessionId);

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
    const { data: existingLootboxes } = await supabaseAdmin
      .from('lootbox_instances')
      .select('id')
      .eq('iap_transaction_id', sessionId)
      .limit(1);

    if (existingLootboxes && existingLootboxes.length > 0) {
      console.log('[verify-lootbox-payment] Already processed by webhook:', sessionId);
      
      // Count how many boxes were credited
      const { count } = await supabaseAdmin
        .from('lootbox_instances')
        .select('*', { count: 'exact', head: true })
        .eq('iap_transaction_id', sessionId);
      
      return new Response(JSON.stringify({ 
        success: true,
        already_processed: true,
        boxes_credited: count || boxes,
        message: 'Lootboxes already credited for this session'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ============================================================
    // FALLBACK: Webhook hasn't processed yet → call atomic RPC
    // ============================================================
    console.log('[verify-lootbox-payment] Webhook not processed, calling RPC fallback');
    
    const { data: result, error: rpcError } = await supabaseAdmin
      .rpc('apply_lootbox_purchase_from_stripe', {
        p_user_id: userId,
        p_session_id: sessionId,
        p_boxes: boxes
      });

    if (rpcError) {
      console.error('[verify-lootbox-payment] RPC error:', rpcError);
      throw rpcError;
    }

    console.log('[verify-lootbox-payment] RPC success:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      boxes_credited: result?.boxes_credited || boxes 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[verify-lootbox-payment] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
