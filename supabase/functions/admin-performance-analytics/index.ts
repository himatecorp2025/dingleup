import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const anon = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anon.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: hasAdminRole } = await anon.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const service = createClient(supabaseUrl, supabaseServiceKey);

    const [{ data: perfMetrics }, { data: perfByPage }, { data: errorsByPage }, { data: errorLogs }] = await Promise.all([
      service.from('performance_metrics').select('*'),
      service.from('performance_by_page').select('*').order('sample_count', { ascending: false }).limit(10),
      service.from('error_rate_by_page').select('*').order('error_count', { ascending: false }).limit(10),
      service.from('error_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    const overallMetrics = { avgLoadTime: 0, avgTTFB: 0, avgLCP: 0, avgCLS: 0 };
    if (perfMetrics && perfMetrics.length > 0) {
      overallMetrics.avgLoadTime = Math.round(perfMetrics.reduce((s: number, m: any) => s + (m.load_time_ms || 0), 0) / perfMetrics.length);
      overallMetrics.avgTTFB = Math.round(perfMetrics.reduce((s: number, m: any) => s + (m.ttfb_ms || 0), 0) / perfMetrics.length);
      overallMetrics.avgLCP = Math.round(perfMetrics.reduce((s: number, m: any) => s + (m.lcp_ms || 0), 0) / perfMetrics.length);
      overallMetrics.avgCLS = Number((perfMetrics.reduce((s: number, m: any) => s + (Number(m.cls) || 0), 0) / perfMetrics.length).toFixed(3));
    }

    const deviceMap = new Map<string, { total: number; count: number }>();
    (perfMetrics || []).forEach((m: any) => {
      const device = m.device_type || 'unknown';
      const current = deviceMap.get(device) || { total: 0, count: 0 };
      current.total += m.load_time_ms || 0;
      current.count += 1;
      deviceMap.set(device, current);
    });
    const performanceByDevice = Array.from(deviceMap.entries()).map(([device_type, data]) => ({ device_type, avg_load_time: Math.round(data.total / data.count), sample_count: data.count }));

    const browserMap = new Map<string, { total: number; count: number }>();
    (perfMetrics || []).forEach((m: any) => {
      const browser = m.browser || 'unknown';
      const current = browserMap.get(browser) || { total: 0, count: 0 };
      current.total += m.load_time_ms || 0;
      current.count += 1;
      browserMap.set(browser, current);
    });
    const performanceByBrowser = Array.from(browserMap.entries()).map(([browser, data]) => ({ browser, avg_load_time: Math.round(data.total / data.count), sample_count: data.count }));

    const errorCountMap = new Map<string, { message: string; count: number; last: string }>();
    (errorLogs || []).forEach((log: any) => {
      const key = log.error_type;
      const current = errorCountMap.get(key) || { message: log.error_message, count: 0, last: log.created_at };
      current.count += 1;
      if (new Date(log.created_at) > new Date(current.last)) current.last = log.created_at;
      errorCountMap.set(key, current);
    });
    const topErrors = Array.from(errorCountMap.entries()).map(([error_type, data]) => ({ error_type, error_message: data.message, count: data.count, last_occurrence: data.last })).sort((a, b) => b.count - a.count).slice(0, 10);

    return new Response(JSON.stringify({
      overallMetrics,
      performanceByPage: perfByPage || [],
      performanceByDevice,
      performanceByBrowser,
      errorsByPage: errorsByPage || [],
      topErrors,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[admin-performance-analytics] Fatal', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});