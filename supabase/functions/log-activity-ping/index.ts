import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LOG-ACTIVITY-PING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { bucketStart, source, deviceClass } = await req.json();
    
    if (!bucketStart || !source || !deviceClass) {
      throw new Error("Missing required fields");
    }

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
