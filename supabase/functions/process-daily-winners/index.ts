import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

/**
 * Gets the current local time for a given timezone
 */
function getLocalTime(timezone: string): Date {
  const utcDate = new Date();
  const localString = utcDate.toLocaleString('en-US', { timeZone: timezone });
  return new Date(localString);
}

/**
 * Checks if it's time to process daily winners for a timezone (23:55-23:59)
 */
function shouldProcessTimezone(timezone: string): boolean {
  const localTime = getLocalTime(timezone);
  const hour = localTime.getHours();
  const minute = localTime.getMinutes();
  
  // Process between 23:55 and 23:59
  return hour === 23 && minute >= 55;
}

/**
 * Gets yesterday's date in local timezone
 */
function getYesterdayDate(timezone: string): string {
  const localTime = getLocalTime(timezone);
  const yesterday = new Date(localTime);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Gets yesterday's day of week (1=Monday, 2=Tuesday, ..., 7=Sunday)
 */
function getYesterdayDayOfWeek(timezone: string): number {
  const localTime = getLocalTime(timezone);
  const yesterday = new Date(localTime);
  yesterday.setDate(yesterday.getDate() - 1);
  const jsDay = yesterday.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  // Convert to database format: 1=Monday, 2=Tuesday, ..., 7=Sunday
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Checks if yesterday was Sunday (for jackpot determination)
 */
function wasYesterdaySunday(timezone: string): boolean {
  return getYesterdayDayOfWeek(timezone) === 7;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  // Parse request body for targetDate parameter
  let targetDate: string | null = null;
  try {
    const body = await req.json();
    targetDate = body.targetDate || null;
  } catch {
    // No body or invalid JSON - proceed without targetDate
  }

  // Verify cron secret OR admin authentication OR authenticated user OR test mode in development
  const cronSecret = req.headers.get('x-supabase-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  
  const hasValidCronSecret = cronSecret && cronSecret === expectedSecret;
  let isAdmin = false;
  let hasValidAuth = false;
  
  // Parse URL for test mode
  const url = new URL(req.url);
  const testMode = url.searchParams.get('test_mode') === 'true';
  const isDevelopment = (Deno.env.get('SUPABASE_URL') || '').includes('wdpxmwsxhckazwxufttk');

  if (!hasValidCronSecret) {
    // Check if request has valid JWT (any authenticated user can trigger on-demand processing)
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { 
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false }
        }
      );
      
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        hasValidAuth = true;
        
        // Check if user has admin role (optional - admins can force processing)
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        isAdmin = !!roleData;
      }
    }
  }

  // Allow if: valid cron secret, authenticated user, admin, or test mode in dev
  const isAuthorized = hasValidCronSecret || hasValidAuth || isAdmin || (testMode && isDevelopment);

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }), 
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    console.log('[DAILY-WINNERS] Starting timezone-based daily winners processing...');
    
    // Check if this is an on-demand request (not cron)
    const isOnDemandRequest = !hasValidCronSecret;
    
    if (isOnDemandRequest) {
      console.log('[DAILY-WINNERS] On-demand processing requested - processing all timezones immediately');
    }

    // Get all distinct user timezones
    const { data: timezones, error: timezonesError } = await supabaseClient
      .from('profiles')
      .select('user_timezone')
      .not('user_timezone', 'is', null);

    if (timezonesError) throw timezonesError;

    const uniqueTimezones = [...new Set(timezones?.map(t => t.user_timezone).filter(Boolean))];
    console.log(`[DAILY-WINNERS] Found ${uniqueTimezones.length} unique timezones to check`);

    const processedTimezones: string[] = [];
    const skippedTimezones: string[] = [];
    let totalProcessedWinners = 0;

    // PERFORMANCE OPTIMIZATION: Use set-based RPC instead of N+1 loop pattern
    // Process each timezone separately
    for (const timezone of uniqueTimezones) {
      // For on-demand requests, skip time check - process immediately
      // For cron requests, only process if time is 23:55-23:59 local time
      if (!isOnDemandRequest && !shouldProcessTimezone(timezone)) {
        const localTime = getLocalTime(timezone);
        console.log(`[DAILY-WINNERS] Not time yet for ${timezone} (local time: ${localTime.toLocaleTimeString()})`);
        skippedTimezones.push(timezone);
        continue;
      }

      const yesterdayDate = getYesterdayDate(timezone);
      const localTime = getLocalTime(timezone);
      console.log(`[DAILY-WINNERS] Processing ${timezone} - Local time: ${localTime.toLocaleString()}, Yesterday: ${yesterdayDate}`);

      // Check if already processed for this date (idempotency check)
      const { data: logCheck } = await supabaseClient
        .from('daily_winner_processing_log')
        .select('last_processed_date')
        .eq('timezone', timezone)
        .single();

      if (logCheck?.last_processed_date === yesterdayDate) {
        console.log(`[DAILY-WINNERS] ${timezone} already processed for ${yesterdayDate}`);
        skippedTimezones.push(timezone);
        continue;
      }

      // OPTIMIZED: Call set-based RPC for this date
      // Replaces entire N+1 country/user loop with single window function query
      const startProcess = Date.now();
      const { data: processResult, error: processError } = await supabaseClient
        .rpc('process_daily_winners_for_date', {
          p_target_date: yesterdayDate
        });

      const processElapsed = Date.now() - startProcess;

      if (processError) {
        console.error(`[DAILY-WINNERS] RPC error for ${yesterdayDate}:`, processError);
        skippedTimezones.push(timezone);
        continue;
      }

      if (!processResult?.success) {
        console.error(`[DAILY-WINNERS] Processing failed for ${yesterdayDate}:`, processResult);
        skippedTimezones.push(timezone);
        continue;
      }

      // Log successful processing with metrics
      const { winners_inserted, snapshots_inserted, is_sunday, top_limit } = processResult;
      console.log(`[DAILY-WINNERS] ${timezone} (${yesterdayDate}): ${winners_inserted} winners, ${snapshots_inserted} snapshots (${is_sunday ? 'Sunday TOP25' : 'Daily TOP10'}) in ${processElapsed}ms`);
      
      totalProcessedWinners += winners_inserted || 0;

      // Update processing log for this timezone
      await supabaseClient
        .from('daily_winner_processing_log')
        .upsert({
          timezone: timezone,
          last_processed_date: yesterdayDate,
          last_processed_at: new Date().toISOString()
        }, {
          onConflict: 'timezone'
        });

      processedTimezones.push(timezone);
    }

    console.log(`[DAILY-WINNERS] Completed. Processed: ${processedTimezones.length}, Skipped: ${skippedTimezones.length}, Winners: ${totalProcessedWinners}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processedTimezones,
        skippedTimezones,
        totalTimezones: uniqueTimezones.length,
        winnersProcessed: totalProcessedWinners
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[DAILY-WINNERS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
