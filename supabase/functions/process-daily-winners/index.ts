import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { startMetrics, measureStage, incDbQuery, logSuccess, logError } from '../_shared/metrics.ts';

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
  const correlationId = crypto.randomUUID();
  const ctx = startMetrics({ functionName: 'process-daily-winners', userId: null });
  ctx.extra['correlation_id'] = correlationId;

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
    ctx.extra['authorized_via'] = hasValidCronSecret ? 'cron' : (isAdmin ? 'admin' : 'user');
    ctx.extra['is_on_demand'] = !hasValidCronSecret;
    
    // Get all distinct user timezones
    const { data: timezones, error: timezonesError } = await measureStage(ctx, 'fetch_timezones', async () => {
      incDbQuery(ctx);
      return await supabaseClient
        .from('profiles')
        .select('user_timezone')
        .not('user_timezone', 'is', null);
    });

    if (timezonesError) throw timezonesError;

    const uniqueTimezones = [...new Set(timezones?.map(t => t.user_timezone).filter(Boolean))];
    ctx.extra['total_timezones'] = uniqueTimezones.length;

    const processedTimezones: string[] = [];
    const skippedTimezones: string[] = [];
    let totalProcessedWinners = 0;

    // PERFORMANCE OPTIMIZATION: Use set-based RPC instead of N+1 loop pattern
    for (const timezone of uniqueTimezones) {
      const isOnDemandRequest = !hasValidCronSecret;
      
      if (!isOnDemandRequest && !shouldProcessTimezone(timezone)) {
        skippedTimezones.push(timezone);
        continue;
      }

      const yesterdayDate = getYesterdayDate(timezone);

      // Idempotency check
      const { data: logCheck } = await measureStage(ctx, `tz_${timezone}_check`, async () => {
        incDbQuery(ctx);
        return await supabaseClient
          .from('daily_winner_processing_log')
          .select('last_processed_date')
          .eq('timezone', timezone)
          .single();
      });

      if (logCheck?.last_processed_date === yesterdayDate) {
        skippedTimezones.push(timezone);
        continue;
      }

      // Call set-based RPC
      const { data: processResult, error: processError } = await measureStage(ctx, `tz_${timezone}_process`, async () => {
        incDbQuery(ctx);
        return await supabaseClient
          .rpc('process_daily_winners_for_date', {
            p_target_date: yesterdayDate
          });
      });

      if (processError || !processResult?.success) {
        logError(ctx, processError || new Error('RPC_FAILED'), { timezone, date: yesterdayDate, result: processResult });
        skippedTimezones.push(timezone);
        continue;
      }

      totalProcessedWinners += processResult.winners_inserted || 0;

      // Update log
      await measureStage(ctx, `tz_${timezone}_log_update`, async () => {
        incDbQuery(ctx);
        return await supabaseClient
          .from('daily_winner_processing_log')
          .upsert({
            timezone,
            last_processed_date: yesterdayDate,
            last_processed_at: new Date().toISOString()
          }, { onConflict: 'timezone' });
      });

      processedTimezones.push(timezone);
    }

    logSuccess(ctx, { 
      correlation_id: correlationId,
      processed_count: processedTimezones.length,
      skipped_count: skippedTimezones.length,
      total_winners: totalProcessedWinners
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        processedTimezones,
        skippedTimezones,
        totalTimezones: uniqueTimezones.length,
        winnersProcessed: totalProcessedWinners,
        correlation_id: correlationId,
        performance: {
          elapsed_ms: Date.now() - ctx.startTime,
          db_queries: ctx.dbQueryCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logError(ctx, error, { correlation_id: correlationId });
    return new Response(
      JSON.stringify({ error: error.message, correlation_id: correlationId }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
