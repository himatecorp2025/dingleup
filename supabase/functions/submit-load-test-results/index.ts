import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface LoadTestResultPayload {
  test_type: 'comprehensive' | 'game_only';
  total_requests: number;
  failed_requests: number;
  error_rate: number;
  avg_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  current_capacity: number;
  metrics?: any;
  bottlenecks?: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    component: string;
    description: string;
    impact: string;
    recommendation: string;
  }>;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Create service role client (bypasses RLS for admin operations)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    );

    const payload: LoadTestResultPayload = await req.json();

    // Validate payload
    if (!payload.test_type || !['comprehensive', 'game_only'].includes(payload.test_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid test_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert load test result
    const { data: testResult, error: testError } = await supabaseAdmin
      .from('load_test_results')
      .insert({
        test_type: payload.test_type,
        test_date: new Date().toISOString(),
        total_requests: payload.total_requests || 0,
        failed_requests: payload.failed_requests || 0,
        error_rate: payload.error_rate || 0,
        avg_response_time: payload.avg_response_time || 0,
        p95_response_time: payload.p95_response_time || 0,
        p99_response_time: payload.p99_response_time || 0,
        current_capacity: payload.current_capacity || 0,
        target_capacity: 10000,
        test_status: 'completed',
        metrics: payload.metrics || {},
      })
      .select()
      .single();

    if (testError) {
      console.error('[submit-load-test-results] Test result insert error:', testError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert test result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[submit-load-test-results] Test result inserted:', testResult.id);

    // Insert bottlenecks if provided
    if (payload.bottlenecks && payload.bottlenecks.length > 0) {
      const bottleneckInserts = payload.bottlenecks.map(b => ({
        test_result_id: testResult.id,
        severity: b.severity,
        component: b.component,
        description: b.description,
        impact: b.impact,
        recommendation: b.recommendation,
        status: 'open',
      }));

      const { error: bottleneckError } = await supabaseAdmin
        .from('load_test_bottlenecks')
        .insert(bottleneckInserts);

      if (bottleneckError) {
        console.error('[submit-load-test-results] Bottleneck insert error:', bottleneckError);
      } else {
        console.log('[submit-load-test-results] Inserted', bottleneckInserts.length, 'bottlenecks');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        test_result_id: testResult.id,
        message: 'Load test results submitted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[submit-load-test-results] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
