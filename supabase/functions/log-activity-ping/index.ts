import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LOG-ACTIVITY-PING] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Client for auth verification (with user's token)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseAuth.auth.getUser(token);
    const user = data.user;
    
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Client for database operations (bypasses RLS)
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

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
      logStep('validation-error', { error: 'Invalid timestamp format' });
      throw new Error("Invalid timestamp format");
    }
    
    if (bucketTime > now + 60000) {
      logStep('validation-error', { error: 'Timestamp is in the future' });
      throw new Error("Timestamp cannot be in the future");
    }
    
    if (bucketTime < now - maxAge) {
      logStep('validation-error', { error: 'Timestamp too old' });
      throw new Error("Timestamp too old (must be within last 15 minutes)");
    }

    // Validate enum values
    const VALID_SOURCES = ['app_open', 'route_view', 'interaction', 'gameplay', 'purchase', 'chat'];
    const VALID_DEVICE_CLASSES = ['mobile', 'tablet', 'desktop'];
    
    if (!VALID_SOURCES.includes(source)) {
      logStep('validation-error', { error: 'Invalid source', source });
      throw new Error(`Invalid source: must be one of ${VALID_SOURCES.join(', ')}`);
    }
    
    if (!VALID_DEVICE_CLASSES.includes(deviceClass)) {
      logStep('validation-error', { error: 'Invalid device class', deviceClass });
      throw new Error(`Invalid device class: must be one of ${VALID_DEVICE_CLASSES.join(', ')}`);
    }

    logStep("Input validation passed", { bucketStart, source, deviceClass });

    // Round to 5-minute bucket
    const bucketDate = new Date(bucketStart);
    const minutes = Math.floor(bucketDate.getMinutes() / 5) * 5;
    bucketDate.setMinutes(minutes, 0, 0);
    
    logStep("Rounded bucket", { original: bucketStart, rounded: bucketDate.toISOString() });

    // Upsert ping (idempotent)
    const { error: insertError } = await supabaseClient
      .from('user_activity_pings')
      .upsert({
        user_id: user.id,
        bucket_start: bucketDate.toISOString(),
        device_class: deviceClass,
        source: source
      }, {
        onConflict: 'user_id,bucket_start',
        ignoreDuplicates: true
      });

    if (insertError) {
      logStep("ERROR inserting ping", { error: insertError.message });
      throw insertError;
    }

    logStep("Ping logged successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
