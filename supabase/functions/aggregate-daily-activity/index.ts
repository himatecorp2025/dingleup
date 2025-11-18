import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Security: Verify this is a legitimate cron request using secret
    const cronSecret = req.headers.get('x-supabase-cron-secret');
    if (cronSecret !== Deno.env.get('SUPABASE_CRON_SECRET')) {
      console.warn('[SECURITY] Unauthorized access attempt to cron endpoint');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('Starting daily activity aggregation...');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get all dates that have pings but no daily record
    const { data: datesToAggregate, error: datesError } = await supabaseAdmin
      .from('user_activity_pings')
      .select('bucket_start')
      .order('bucket_start', { ascending: false })
      .limit(10000);

    if (datesError) {
      console.error('Error fetching dates:', datesError);
      throw datesError;
    }

    // Group by user and date
    const userDateMap = new Map<string, Set<string>>();
    
    if (datesToAggregate) {
      for (const ping of datesToAggregate) {
        const date = new Date(ping.bucket_start).toISOString().split('T')[0];
        
        // Get user_id from the ping
        const { data: pingDetails } = await supabaseAdmin
          .from('user_activity_pings')
          .select('user_id')
          .eq('bucket_start', ping.bucket_start)
          .single();
        
        if (pingDetails) {
          const key = `${pingDetails.user_id}:${date}`;
          if (!userDateMap.has(key)) {
            userDateMap.set(key, new Set());
          }
        }
      }
    }

    console.log(`Processing ${userDateMap.size} user-date combinations...`);

    let aggregated = 0;
    const uniqueUserDates = new Set<string>();

    // Get distinct user-date pairs using safe Supabase client methods
    const { data: pings, error: pingsError } = await supabaseAdmin
      .from('user_activity_pings')
      .select('user_id, bucket_start')
      .order('bucket_start', { ascending: false })
      .limit(10000);

    // Process in JavaScript to get distinct user-date pairs
    const distinctUserDates: Array<{ user_id: string; activity_date: string }> = [];
    
    if (!pingsError && pings) {
      for (const ping of pings) {
        const activity_date = new Date(ping.bucket_start).toISOString().split('T')[0];
        const key = `${ping.user_id}:${activity_date}`;
        
        if (uniqueUserDates.has(key)) continue;
        uniqueUserDates.add(key);
        
        distinctUserDates.push({ user_id: ping.user_id, activity_date });
        
        // Limit to 1000 distinct user-date pairs
        if (distinctUserDates.length >= 1000) break;
      }

      for (const { user_id, activity_date } of distinctUserDates) {
        const key = `${user_id}:${activity_date}`;
        
        if (uniqueUserDates.has(key)) continue;
        uniqueUserDates.add(key);

        // Check if already aggregated
        const { data: existing } = await supabaseAdmin
          .from('user_activity_daily')
          .select('user_id')
          .eq('user_id', user_id)
          .eq('date', activity_date)
          .single();

        if (existing) continue;

        // Aggregate for this user-date
        const histogram = await buildHistogram(supabaseAdmin, user_id, activity_date);
        const topSlots = findTopSlots(histogram);

        // Insert/update
        const { error: upsertError } = await supabaseAdmin
          .from('user_activity_daily')
          .upsert({
            user_id,
            date: activity_date,
            histogram,
            top_slots: topSlots,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,date'
          });

        if (upsertError) {
          console.error(`Error upserting for ${user_id} on ${activity_date}:`, upsertError);
        } else {
          aggregated++;
        }

        // Rate limit to avoid overwhelming the database
        if (aggregated % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } else if (pingsError) {
      console.error('Error fetching pings:', pingsError);
    }

    console.log(`Successfully aggregated ${aggregated} user-date records`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        aggregated,
        message: `Aggregated ${aggregated} user-date records`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in aggregate-daily-activity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function buildHistogram(supabase: any, userId: string, date: string): Promise<number[]> {
  const histogram = new Array(288).fill(0);

  const { data: pings } = await supabase
    .from('user_activity_pings')
    .select('bucket_start')
    .eq('user_id', userId)
    .gte('bucket_start', `${date}T00:00:00Z`)
    .lt('bucket_start', `${date}T23:59:59Z`);

  if (pings) {
    for (const ping of pings) {
      const dt = new Date(ping.bucket_start);
      const minutesFromMidnight = dt.getUTCHours() * 60 + dt.getUTCMinutes();
      const bucketIdx = Math.floor(minutesFromMidnight / 5);
      if (bucketIdx >= 0 && bucketIdx < 288) {
        histogram[bucketIdx]++;
      }
    }
  }

  return histogram;
}

function findTopSlots(histogram: number[]): any {
  const slots = histogram
    .map((events, idx) => ({
      slot: idx,
      events,
    }))
    .filter(s => s.events > 0)
    .sort((a, b) => b.events - a.events)
    .slice(0, 6);

  return { slots: slots.map(s => s.slot) };
}
