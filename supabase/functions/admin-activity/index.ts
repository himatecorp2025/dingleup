import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface ActivityQueryParams {
  from: string;
  to: string;
  tz: string;
  device?: string;
  plan?: string;
  action?: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: hasAdminRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'summary';
    const from = url.searchParams.get('from') || new Date().toISOString().split('T')[0];
    const to = url.searchParams.get('to') || new Date().toISOString().split('T')[0];
    const tz = url.searchParams.get('tz') || 'Europe/Budapest';
    const device = url.searchParams.get('device') || 'all';
    const plan = url.searchParams.get('plan') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1');
    const size = parseInt(url.searchParams.get('size') || '50');

    if (action === 'summary') {
      const trendRange = url.searchParams.get('trendRange') || 'last30';
      const summary = await getSummary(supabaseClient, { from, to, tz, device, plan, action: trendRange });
      return new Response(JSON.stringify(summary), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'table-5min') {
      const data = await getTable5Min(supabaseClient, { from, to: from, tz, device, plan }, page, size);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'table-hourly') {
      const data = await getTableHourly(supabaseClient, { from, to, tz, device, plan }, page, size);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'export-5min') {
      const csv = await exportCSV5Min(supabaseClient, { from, to: from, tz, device, plan });
      return new Response(csv, {
        headers: { ...corsHeaders, 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="activity-5min-${from}.csv"` },
      });
    }

    if (action === 'export-hourly') {
      const csv = await exportCSVHourly(supabaseClient, { from, to, tz, device, plan });
      return new Response(csv, {
        headers: { ...corsHeaders, 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="activity-hourly-${from}-${to}.csv"` },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getSummary(supabase: any, params: ActivityQueryParams) {
  const { from, to, tz, action } = params;

  const dauQuery = `
    SELECT count(DISTINCT user_id) AS dau
    FROM user_activity_pings
    WHERE bucket_start >= '${from}T00:00:00Z'::timestamptz
      AND bucket_start < '${to}T23:59:59Z'::timestamptz
  `;
  const { data: dauData } = await supabase.rpc('execute_raw_sql', { query: dauQuery });
  const dau = dauData?.[0]?.dau || 0;

  const avgQuery = `
    SELECT count(*)::numeric / NULLIF(count(DISTINCT user_id), 0) AS avg_events
    FROM user_activity_pings
    WHERE bucket_start >= '${from}T00:00:00Z'::timestamptz
      AND bucket_start < '${to}T23:59:59Z'::timestamptz
  `;
  const { data: avgData } = await supabase.rpc('execute_raw_sql', { query: avgQuery });
  const avgEventsPerUser = parseFloat(avgData?.[0]?.avg_events || '0');

  const histogram5min = await getHistogram5Min(supabase, from, tz);
  const histogram5minAvg7d = await getHistogram5MinAvg(supabase, from, tz, 7);
  const heatmapWeek = await getHeatmapWeek(supabase, from, to, tz);
  const topSlotsToday = await getTopSlots(supabase, from, tz, 5);
  const topSlots7d = await getTopSlots7d(supabase, from, tz, 5);
  const topHourLast7d = await getTopHour7d(supabase, from, tz);
  const topDayLast7d = await getTopDay7d(supabase, from);
  const avgActivityTrend = await getAvgActivityTrend(supabase, from, action || 'last30', tz);

  return {
    dateRange: { from, to, tz },
    dau,
    avgEventsPerUser: Math.round(avgEventsPerUser * 10) / 10,
    topHourLast7d,
    topDayLast7d,
    histogram_5min: histogram5min,
    histogram_5min_avg7d: histogram5minAvg7d,
    heatmap_week: heatmapWeek,
    topSlotsToday,
    topSlots7d,
    avgActivityTrend,
  };
}

async function getHistogram5Min(supabase: any, date: string, tz: string) {
  const { data } = await supabase
    .from('user_activity_pings')
    .select('bucket_start')
    .gte('bucket_start', `${date}T00:00:00Z`)
    .lt('bucket_start', `${date}T23:59:59Z`);

  const histogram = new Array(288).fill(0);
  
  if (data) {
    for (const row of data) {
      const dt = new Date(row.bucket_start);
      const localTime = new Date(dt.toLocaleString('en-US', { timeZone: tz }));
      const minutesFromMidnight = localTime.getHours() * 60 + localTime.getMinutes();
      const bucketIdx = Math.floor(minutesFromMidnight / 5);
      if (bucketIdx >= 0 && bucketIdx < 288) {
        histogram[bucketIdx]++;
      }
    }
  }

  return histogram;
}

async function getHistogram5MinAvg(supabase: any, endDate: string, tz: string, days: number) {
  const histograms: number[][] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const hist = await getHistogram5Min(supabase, dateStr, tz);
    histograms.push(hist);
  }

  const avgHistogram = new Array(288).fill(0);
  for (let i = 0; i < 288; i++) {
    const sum = histograms.reduce((acc, hist) => acc + hist[i], 0);
    avgHistogram[i] = Math.round(sum / days);
  }

  return avgHistogram;
}

async function getHeatmapWeek(supabase: any, from: string, to: string, tz: string) {
  const { data } = await supabase
    .from('user_activity_pings')
    .select('bucket_start')
    .gte('bucket_start', `${from}T00:00:00Z`)
    .lt('bucket_start', `${to}T23:59:59Z`);

  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  if (data) {
    for (const row of data) {
      const dt = new Date(row.bucket_start);
      const localTime = new Date(dt.toLocaleString('en-US', { timeZone: tz }));
      const dow = (localTime.getDay() + 6) % 7;
      const hour = localTime.getHours();
      heatmap[dow][hour]++;
    }
  }

  return heatmap;
}

async function getTopSlots(supabase: any, date: string, tz: string, limit: number) {
  const histogram = await getHistogram5Min(supabase, date, tz);
  const total = histogram.reduce((a, b) => a + b, 0);

  const slots = histogram.map((events, idx) => {
    const hour = Math.floor(idx * 5 / 60);
    const min = (idx * 5) % 60;
    const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    const endHour = Math.floor((idx * 5 + 5) / 60);
    const endMin = ((idx * 5 + 5) % 60);
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    
    return {
      start: startTime,
      end: endTime,
      events,
      share: total > 0 ? Math.round((events / total) * 1000) / 1000 : 0,
    };
  });

  return slots.sort((a, b) => b.events - a.events).slice(0, limit);
}

async function getTopSlots7d(supabase: any, endDate: string, tz: string, limit: number) {
  const allSlots: { [key: string]: number } = {};

  for (let i = 0; i < 7; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const histogram = await getHistogram5Min(supabase, dateStr, tz);

    histogram.forEach((events, idx) => {
      const hour = Math.floor(idx * 5 / 60);
      const min = (idx * 5) % 60;
      const key = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      allSlots[key] = (allSlots[key] || 0) + events;
    });
  }

  const slots = Object.entries(allSlots).map(([start, events]) => {
    const [h, m] = start.split(':').map(Number);
    const endMin = (h * 60 + m + 5);
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const end = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    const total = Object.values(allSlots).reduce((a, b) => a + b, 0);

    return {
      start,
      end,
      events,
      share: total > 0 ? Math.round((events / total) * 1000) / 1000 : 0,
    };
  });

  return slots.sort((a, b) => b.events - a.events).slice(0, limit);
}

async function getTopHour7d(supabase: any, endDate: string, tz: string) {
  const heatmap = await getHeatmapWeek(supabase, 
    new Date(new Date(endDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate,
    tz
  );

  let maxEvents = 0;
  let maxDow = 0;
  let maxHour = 0;

  heatmap.forEach((day, dow) => {
    day.forEach((events, hour) => {
      if (events > maxEvents) {
        maxEvents = events;
        maxDow = dow;
        maxHour = hour;
      }
    });
  });

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return { dow: dayNames[maxDow], hour: maxHour, events: maxEvents };
}

async function getTopDay7d(supabase: any, endDate: string) {
  const days: { [key: string]: number } = {};

  for (let i = 0; i < 7; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const { data } = await supabase
      .from('user_activity_pings')
      .select('id', { count: 'exact' })
      .gte('bucket_start', `${dateStr}T00:00:00Z`)
      .lt('bucket_start', `${dateStr}T23:59:59Z`);

    days[dateStr] = data?.length || 0;
  }

  const maxDay = Object.entries(days).sort((a, b) => b[1] - a[1])[0];
  return { date: maxDay[0], events: maxDay[1] };
}

async function getAvgActivityTrend(supabase: any, endDate: string, range: string, tz: string) {
  let daysBack = 30;
  if (range === 'last7') daysBack = 7;
  else if (range === 'last90') daysBack = 90;
  else if (range === 'all') daysBack = 365;

  const trend: Array<{ date: string; avgEvents: number; activeUsers: number }> = [];

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const { data: pings } = await supabase
      .from('user_activity_pings')
      .select('user_id')
      .gte('bucket_start', `${dateStr}T00:00:00Z`)
      .lt('bucket_start', `${dateStr}T23:59:59Z`);

    if (pings && pings.length > 0) {
      const uniqueUsers = new Set(pings.map((p: any) => p.user_id)).size;
      const avgEvents = pings.length / uniqueUsers;

      trend.unshift({
        date: dateStr,
        avgEvents: Math.round(avgEvents * 10) / 10,
        activeUsers: uniqueUsers,
      });
    }
  }

  return trend;
}

async function getTable5Min(supabase: any, params: ActivityQueryParams, page: number, size: number) {
  const histogram = await getHistogram5Min(supabase, params.from, params.tz);
  const total = histogram.reduce((a, b) => a + b, 0);

  const rows = histogram.map((events, idx) => {
    const hour = Math.floor(idx * 5 / 60);
    const min = (idx * 5) % 60;
    const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    const endHour = Math.floor((idx * 5 + 5) / 60);
    const endMin = ((idx * 5 + 5) % 60);
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    
    return {
      slot: `${startTime}–${endTime}`,
      events,
      share: total > 0 ? Math.round((events / total) * 10000) / 100 : 0,
    };
  });

  const start = (page - 1) * size;
  const end = start + size;

  return {
    data: rows.slice(start, end),
    total: rows.length,
    page,
    size,
  };
}

async function getTableHourly(supabase: any, params: ActivityQueryParams, page: number, size: number) {
  const heatmap = await getHeatmapWeek(supabase, params.from, params.to, params.tz);
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const rows: any[] = [];
  heatmap.forEach((day, dow) => {
    day.forEach((events, hour) => {
      rows.push({
        day: dayNames[dow],
        hour: `${hour.toString().padStart(2, '0')}:00`,
        events,
        avgPerDay: Math.round(events / 7 * 10) / 10,
      });
    });
  });

  const start = (page - 1) * size;
  const end = start + size;

  return {
    data: rows.slice(start, end),
    total: rows.length,
    page,
    size,
  };
}

async function exportCSV5Min(supabase: any, params: ActivityQueryParams) {
  const histogram = await getHistogram5Min(supabase, params.from, params.tz);
  const total = histogram.reduce((a, b) => a + b, 0);

  let csv = 'Time Slot,Events,Share (%)\n';
  histogram.forEach((events, idx) => {
    const hour = Math.floor(idx * 5 / 60);
    const min = (idx * 5) % 60;
    const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    const endHour = Math.floor((idx * 5 + 5) / 60);
    const endMin = ((idx * 5 + 5) % 60);
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    const share = total > 0 ? Math.round((events / total) * 10000) / 100 : 0;
    
    csv += `"${startTime}–${endTime}",${events},${share}\n`;
  });

  return csv;
}

async function exportCSVHourly(supabase: any, params: ActivityQueryParams) {
  const heatmap = await getHeatmapWeek(supabase, params.from, params.to, params.tz);
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  let csv = 'Day,Hour,Events,Avg Per Day\n';
  heatmap.forEach((day, dow) => {
    day.forEach((events, hour) => {
      const avgPerDay = Math.round(events / 7 * 10) / 10;
      csv += `${dayNames[dow]},${hour.toString().padStart(2, '0')}:00,${events},${avgPerDay}\n`;
    });
  });

  return csv;
}
