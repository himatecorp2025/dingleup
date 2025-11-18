import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Security: Verify this is a legitimate cron request using secret
    const cronSecret = req.headers.get('x-supabase-cron-secret');
    if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      console.warn('[CLEANUP] Unauthorized access attempt to cron endpoint');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    console.log('[CLEANUP] Starting analytics cleanup job');

    // Call the cleanup function
    const { error } = await supabaseClient.rpc('cleanup_old_analytics');

    if (error) {
      console.error('[CLEANUP] Error cleaning analytics:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('[CLEANUP] Analytics cleaned successfully (90+ day old data removed)');
    return new Response(
      JSON.stringify({ success: true, message: 'Old analytics data cleaned successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[CLEANUP] Error in cleanup-analytics function:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing the request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});