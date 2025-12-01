// PHASE 1 OPTIMIZATION: Refresh materialized view for daily rankings
// Runs every 5 minutes to update ranks without blocking game completions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    console.log('[refresh-daily-rankings-mv] Starting refresh...');
    const startTime = Date.now();

    // Refresh the materialized view CONCURRENTLY (non-blocking)
    const { error } = await supabase.rpc('refresh_mv_daily_rankings');
    
    if (error) {
      console.error('[refresh-daily-rankings-mv] Error:', error);
      throw error;
    }

    const elapsed = Date.now() - startTime;
    console.log(`[refresh-daily-rankings-mv] ✅ Refreshed in ${elapsed}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        elapsed_ms: elapsed,
        refreshed_at: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[refresh-daily-rankings-mv] Failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
