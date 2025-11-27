import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Client with SERVICE_ROLE_KEY for DB operations
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.slice(7).trim();

    let userId: string | null = null;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        console.error('[log-activity-ping] Invalid JWT format');
      } else {
        const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadJson);
        if (typeof payload.sub === "string") {
          userId = payload.sub;
        }
      }
    } catch (err) {
      console.error('[log-activity-ping] Failed to decode JWT', err);
    }

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { bucketStart, source, deviceClass } = await req.json();

    // Validate required fields
    if (!bucketStart || !source || !deviceClass) {
      throw new Error("Missing required fields");
    }

    // Validate timestamp is recent (within last 15 minutes)
    const now = Date.now();
    const bucketTime = new Date(bucketStart).getTime();
    const maxAge = 15 * 60 * 1000; // 15 minutes
    
    if (isNaN(bucketTime)) {
      throw new Error("Invalid timestamp format");
    }
    
    if (bucketTime > now + 60000) {
      throw new Error("Timestamp cannot be in the future");
    }
    
    if (bucketTime < now - maxAge) {
      throw new Error("Timestamp too old (must be within last 15 minutes)");
    }

    // Validate enum values
    const VALID_SOURCES = ['app_open', 'route_view', 'interaction', 'gameplay', 'purchase', 'chat'];
    const VALID_DEVICE_CLASSES = ['mobile', 'tablet', 'desktop'];
    
    if (!VALID_SOURCES.includes(source)) {
      throw new Error(`Invalid source: must be one of ${VALID_SOURCES.join(', ')}`);
    }
    
    if (!VALID_DEVICE_CLASSES.includes(deviceClass)) {
      throw new Error(`Invalid device class: must be one of ${VALID_DEVICE_CLASSES.join(', ')}`);
    }

    // Round to 5-minute bucket
    const bucketDate = new Date(bucketStart);
    const minutes = Math.floor(bucketDate.getMinutes() / 5) * 5;
    bucketDate.setMinutes(minutes, 0, 0);

    // Upsert ping (idempotent)
    const { error: insertError } = await supabaseClient
      .from('user_activity_pings')
      .upsert({
        user_id: userId,
        bucket_start: bucketDate.toISOString(),
        device_class: deviceClass,
        source: source
      }, {
        onConflict: 'user_id,bucket_start',
        ignoreDuplicates: true
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
