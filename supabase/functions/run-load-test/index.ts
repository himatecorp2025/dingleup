import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoadTestConfig {
  targetUsersPerMinute: number;
  durationMinutes: number;
  testTypes: string[];
}

interface TestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const config: LoadTestConfig = await req.json();
    const testId = crypto.randomUUID();

    console.log(`[run-load-test] Starting load test ${testId}`, config);

    // Start background test execution (don't await)
    runLoadTest(supabaseAdmin, testId, config).catch(err => {
      console.error(`[run-load-test] Background execution error:`, err);
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        testId,
        message: 'Load test started in background',
        estimatedDuration: `${config.durationMinutes} minutes`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[run-load-test] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function runLoadTest(
  supabase: any,
  testId: string,
  config: LoadTestConfig
) {
  const startTime = Date.now();
  const results: Map<string, TestResult> = new Map();
  const bottlenecks: any[] = [];

  console.log(`[load-test-${testId}] Execution started`);

  // Create broadcast channel for real-time progress updates
  const progressChannel = supabase.channel(`load-test-progress-${testId}`);
  
  const sendProgress = async (progress: number, status: string, details: any) => {
    await progressChannel.send({
      type: 'broadcast',
      event: 'progress',
      payload: {
        testId,
        progress,
        status,
        details,
        timestamp: new Date().toISOString(),
      }
    });
  };

  try {
    await sendProgress(0, 'initializing', { message: 'Load test indítása...' });
    // Initialize result tracking
    const endpoints = [
      'register-with-username-pin',
      'login-with-username-pin',
      'start-game-session',
      'complete-game',
      'get-dashboard-data',
      'get-daily-leaderboard-by-country',
      'get-wallet',
    ];

    endpoints.forEach(endpoint => {
      results.set(endpoint, {
        endpoint,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
      });
    });

    // Calculate concurrent users per wave
    const waveDurationMs = 10000; // 10 second waves
    const totalWaves = (config.durationMinutes * 60 * 1000) / waveDurationMs;
    const usersPerWave = Math.ceil(config.targetUsersPerMinute / 6); // 6 waves per minute

    console.log(`[load-test-${testId}] Running ${totalWaves} waves, ${usersPerWave} users per wave`);

    await sendProgress(5, 'running', { 
      message: `${totalWaves} hullám, ${usersPerWave} felhasználó/hullám`,
      totalWaves,
      usersPerWave
    });

    // Execute test waves
    for (let wave = 0; wave < totalWaves; wave++) {
      const wavePromises: Promise<void>[] = [];

      for (let user = 0; user < usersPerWave; user++) {
        wavePromises.push(simulateUserFlow(supabase, results, config.testTypes));
      }

      await Promise.all(wavePromises);
      
      // Calculate current progress
      const progressPercent = Math.round(((wave + 1) / totalWaves) * 100);
      
      // Calculate current metrics
      let currentTotalRequests = 0;
      let currentFailedRequests = 0;
      results.forEach(result => {
        currentTotalRequests += result.totalRequests;
        currentFailedRequests += result.failedRequests;
      });
      const currentErrorRate = currentTotalRequests > 0 ? (currentFailedRequests / currentTotalRequests * 100).toFixed(2) : '0.00';

      // Send progress update after each wave
      await sendProgress(progressPercent, 'running', {
        message: `Hullám ${wave + 1}/${totalWaves} befejezve`,
        completedWaves: wave + 1,
        totalWaves,
        totalRequests: currentTotalRequests,
        failedRequests: currentFailedRequests,
        errorRate: `${currentErrorRate}%`,
        estimatedTimeRemaining: Math.round(((totalWaves - wave - 1) * waveDurationMs) / 1000) + ' másodperc'
      });
      
      // Small delay between waves
      if (wave < totalWaves - 1) {
        await new Promise(resolve => setTimeout(resolve, waveDurationMs));
      }
    }

    // Calculate final metrics
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Aggregate results
    let totalRequests = 0;
    let totalFailedRequests = 0;
    let totalResponseTime = 0;

    results.forEach(result => {
      totalRequests += result.totalRequests;
      totalFailedRequests += result.failedRequests;
      totalResponseTime += result.avgResponseTime * result.totalRequests;

      // Identify bottlenecks
      if (result.errorRate > 0.01) {
        bottlenecks.push({
          component: result.endpoint,
          severity: result.errorRate > 0.05 ? 'critical' : 'high',
          description: `High error rate: ${(result.errorRate * 100).toFixed(2)}%`,
          impact: `${result.failedRequests} failed requests out of ${result.totalRequests}`,
          recommendation: 'Review edge function logs and database performance',
          status: 'open',
        });
      }

      if (result.p95ResponseTime > 2000) {
        bottlenecks.push({
          component: result.endpoint,
          severity: result.p95ResponseTime > 3000 ? 'critical' : 'high',
          description: `Slow P95 response time: ${result.p95ResponseTime}ms`,
          impact: '95% of requests exceed 2s threshold',
          recommendation: 'Optimize database queries and add caching',
          status: 'open',
        });
      }
    });

    const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    const errorRate = totalRequests > 0 ? totalFailedRequests / totalRequests : 0;
    const currentCapacity = Math.floor((totalRequests / durationMs) * 60000); // requests per minute

    // Calculate P95 and P99 from all results
    const allResponseTimes: number[] = [];
    results.forEach(result => {
      if (result.avgResponseTime > 0) {
        allResponseTimes.push(result.avgResponseTime);
      }
    });
    allResponseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(allResponseTimes.length * 0.95);
    const p99Index = Math.floor(allResponseTimes.length * 0.99);
    const p95ResponseTime = allResponseTimes[p95Index] || 0;
    const p99ResponseTime = allResponseTimes[p99Index] || 0;

    // Store results in database
    const { data: testResult, error: insertError } = await supabase
      .from('load_test_results')
      .insert({
        test_type: 'automated_simulation',
        test_status: errorRate < 0.01 ? 'passed' : 'failed',
        total_requests: totalRequests,
        failed_requests: totalFailedRequests,
        avg_response_time: Math.round(avgResponseTime),
        p95_response_time: Math.round(p95ResponseTime),
        p99_response_time: Math.round(p99ResponseTime),
        error_rate: errorRate,
        current_capacity: currentCapacity,
        target_capacity: config.targetUsersPerMinute,
        metrics: {
          duration_ms: durationMs,
          waves: totalWaves,
          users_per_wave: usersPerWave,
          endpoint_results: Array.from(results.values()),
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[load-test-${testId}] Error storing results:`, insertError);
      throw insertError;
    }

    // Store bottlenecks
    if (bottlenecks.length > 0) {
      const bottlenecksWithTestId = bottlenecks.map(b => ({
        ...b,
        test_result_id: testResult.id,
      }));

      const { error: bottleneckError } = await supabase
        .from('load_test_bottlenecks')
        .insert(bottlenecksWithTestId);

      if (bottleneckError) {
        console.error(`[load-test-${testId}] Error storing bottlenecks:`, bottleneckError);
      }
    }

    // Send final completion progress
    await sendProgress(100, 'completed', {
      message: 'Load test befejezve',
      totalRequests,
      failedRequests: totalFailedRequests,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: (errorRate * 100).toFixed(2) + '%',
      currentCapacity,
      targetCapacity: config.targetUsersPerMinute,
      status: errorRate < 0.01 ? 'PASSED' : 'FAILED',
    });

    console.log(`[load-test-${testId}] Completed successfully`, {
      totalRequests,
      failedRequests: totalFailedRequests,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: (errorRate * 100).toFixed(2) + '%',
      currentCapacity,
      targetCapacity: config.targetUsersPerMinute,
      status: errorRate < 0.01 ? 'PASSED' : 'FAILED',
    });

    // Unsubscribe from channel
    await progressChannel.unsubscribe();

  } catch (error: any) {
    console.error(`[load-test-${testId}] Execution error:`, error);
    
    // Send error progress
    await sendProgress(100, 'error', {
      message: 'Load test hiba',
      error: error?.message || 'Ismeretlen hiba',
    });

    // Unsubscribe from channel
    await progressChannel.unsubscribe();
    
    // Store failed test result
    await supabase.from('load_test_results').insert({
      test_type: 'automated_simulation',
      test_status: 'error',
      total_requests: 0,
      failed_requests: 0,
      avg_response_time: 0,
      p95_response_time: 0,
      p99_response_time: 0,
      error_rate: 1,
      current_capacity: 0,
      target_capacity: config.targetUsersPerMinute,
      metrics: {
        error: error?.message || 'Unknown error',
      },
    });
  }
}

async function simulateUserFlow(
  supabase: any,
  results: Map<string, TestResult>,
  testTypes: string[]
): Promise<void> {
  const BASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const headers = {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
  };

  try {
    // 1. Registration
    if (testTypes.includes('auth')) {
      const username = `loadtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pin = String(Math.floor(100000 + Math.random() * 900000));

      const regStart = Date.now();
      const regRes = await fetch(`${BASE_URL}/functions/v1/register-with-username-pin`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username, pin, country_code: 'HU' }),
      });
      const regDuration = Date.now() - regStart;

      updateResult(results, 'register-with-username-pin', regRes.ok, regDuration);

      if (!regRes.ok) return;

      const regData = await regRes.json();
      const authToken = regData.access_token;

      if (!authToken) return;

      const authHeaders = { ...headers, 'Authorization': `Bearer ${authToken}` };

      // 2. Start game session
      if (testTypes.includes('game')) {
        const gameStart = Date.now();
        const gameRes = await fetch(`${BASE_URL}/functions/v1/start-game-session`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ category: 'mixed' }),
        });
        const gameDuration = Date.now() - gameStart;

        updateResult(results, 'start-game-session', gameRes.ok, gameDuration);

        if (gameRes.ok) {
          const gameData = await gameRes.json();

          // Simulate answering 5 questions
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 0.5s delay

            const answerStart = Date.now();
            const answerRes = await fetch(`${BASE_URL}/functions/v1/complete-game`, {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                sessionId: gameData.sessionId,
                questionIndex: i,
                correctAnswers: Math.floor(Math.random() * 2),
                totalQuestions: 15,
                coinsEarned: Math.floor(Math.random() * 10),
                completed: false,
              }),
            });
            const answerDuration = Date.now() - answerStart;

            updateResult(results, 'complete-game', answerRes.ok, answerDuration);
          }
        }
      }

      // 3. Fetch wallet
      if (testTypes.includes('dashboard')) {
        const walletStart = Date.now();
        const walletRes = await fetch(`${BASE_URL}/functions/v1/get-wallet`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({}),
        });
        const walletDuration = Date.now() - walletStart;

        updateResult(results, 'get-wallet', walletRes.ok, walletDuration);
      }

      // 4. Fetch leaderboard
      if (testTypes.includes('leaderboard')) {
        const leaderStart = Date.now();
        const leaderRes = await fetch(`${BASE_URL}/functions/v1/get-daily-leaderboard-by-country`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ country_code: 'HU' }),
        });
        const leaderDuration = Date.now() - leaderStart;

        updateResult(results, 'get-daily-leaderboard-by-country', leaderRes.ok, leaderDuration);
      }
    }

  } catch (error) {
    console.error('[simulateUserFlow] Error:', error);
  }
}

function updateResult(
  results: Map<string, TestResult>,
  endpoint: string,
  success: boolean,
  responseTime: number
) {
  const result = results.get(endpoint);
  if (!result) return;

  result.totalRequests++;
  if (success) {
    result.successfulRequests++;
  } else {
    result.failedRequests++;
  }

  // Update average response time
  const totalResponseTime = result.avgResponseTime * (result.totalRequests - 1) + responseTime;
  result.avgResponseTime = totalResponseTime / result.totalRequests;

  // Approximate P95 and P99 (simplified - would need array of all times for accuracy)
  result.p95ResponseTime = Math.max(result.p95ResponseTime, responseTime * 0.95);
  result.p99ResponseTime = Math.max(result.p99ResponseTime, responseTime * 0.99);

  result.errorRate = result.failedRequests / result.totalRequests;
}
