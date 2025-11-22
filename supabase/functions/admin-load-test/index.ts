import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LoadTestMode = 'test' | 'full';
type LoadTestScenario = 'A' | 'B' | 'C';

interface LoadTestRequest {
  baseUrl: string;
  vus: number;
  requestsPerUser: number;
  delayMs: number;
  scenario: LoadTestScenario;
  mode: LoadTestMode;
  baseFunctionHeaders?: Record<string, string>;
}

interface ErrorSample {
  url: string;
  status?: number;
  error?: string;
  bodySample?: string;
}

interface Stats {
  totalRequests: number;
  success: number;
  failed: number;
  latencies: number[];
  errors: ErrorSample[];
}

const TEST_USERS = [
  { username: 'testuser1', pin: '111111' },
  { username: 'testuser2', pin: '222222' },
  { username: 'testuser3', pin: '333333' },
  { username: 'testuser4', pin: '444444' },
  { username: 'testuser5', pin: '555555' },
  { username: 'testuser6', pin: '666666' },
  { username: 'testuser7', pin: '777777' },
  { username: 'testuser8', pin: '888888' },
  { username: 'testuser9', pin: '999999' },
  { username: 'testuser10', pin: '101010' },
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

async function safeFetch(
  url: string,
  options: RequestInit,
  stats: Stats
): Promise<Response | null> {
  stats.totalRequests++;
  const start = performance.now();

  try {
    const response = await fetch(url, options);
    const latency = performance.now() - start;
    stats.latencies.push(latency);

    if (!response.ok) {
      stats.failed++;
      const bodyText = await response.text().catch(() => '');
      stats.errors.push({
        url,
        status: response.status,
        bodySample: bodyText.substring(0, 200),
      });
      return null;
    }

    stats.success++;
    return response;
  } catch (error: any) {
    const latency = performance.now() - start;
    stats.latencies.push(latency);
    stats.failed++;
    stats.errors.push({
      url,
      error: error.message || 'Network error',
    });
    return null;
  }
}

async function scenarioAUserFlow(
  userIndex: number,
  config: LoadTestRequest,
  stats: Stats
): Promise<void> {
  const user = TEST_USERS[userIndex % TEST_USERS.length];
  const { baseUrl, requestsPerUser, delayMs, baseFunctionHeaders } = config;

  // Login
  const loginResponse = await safeFetch(
    `${baseUrl}/functions/v1/login-with-username-pin`,
    {
      method: 'POST',
      headers: baseFunctionHeaders || { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, pin: user.pin }),
    },
    stats
  );

  if (!loginResponse) return;

  const loginData = await loginResponse.json();
  const token = loginData?.session?.access_token;

  if (!token) return;

  const authHeaders = {
    ...(baseFunctionHeaders || {}),
    'Authorization': `Bearer ${token}`,
  };

  // User flow
  for (let i = 0; i < requestsPerUser; i++) {
    // Start game
    await safeFetch(
      `${baseUrl}/functions/v1/start-game-session`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ category: 'general' }),
      },
      stats
    );

    await sleep(delayMs);

    // Get wallet
    await safeFetch(
      `${baseUrl}/functions/v1/get-wallet`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      },
      stats
    );

    await sleep(delayMs);

    // Get leaderboard
    await safeFetch(
      `${baseUrl}/functions/v1/get-daily-leaderboard-by-country`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      },
      stats
    );

    await sleep(delayMs);
  }
}

async function scenarioBUserFlow(
  userIndex: number,
  config: LoadTestRequest,
  stats: Stats
): Promise<void> {
  const user = TEST_USERS[userIndex % TEST_USERS.length];
  const { baseUrl, requestsPerUser, delayMs, baseFunctionHeaders } = config;

  // Login
  const loginResponse = await safeFetch(
    `${baseUrl}/functions/v1/login-with-username-pin`,
    {
      method: 'POST',
      headers: baseFunctionHeaders || { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, pin: user.pin }),
    },
    stats
  );

  if (!loginResponse) return;

  const loginData = await loginResponse.json();
  const token = loginData?.session?.access_token;

  if (!token) return;

  const authHeaders = {
    ...(baseFunctionHeaders || {}),
    'Authorization': `Bearer ${token}`,
  };

  // Simulate popup/failure scenarios
  for (let i = 0; i < requestsPerUser; i++) {
    // Start game
    const gameResponse = await safeFetch(
      `${baseUrl}/functions/v1/start-game-session`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ category: 'general' }),
      },
      stats
    );

    if (gameResponse) {
      await sleep(delayMs);

      // Simulate wrong answers (trigger popup logic)
      await safeFetch(
        `${baseUrl}/functions/v1/get-wallet`,
        {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({}),
        },
        stats
      );
    }

    await sleep(delayMs);
  }
}

async function scenarioCUserFlow(
  userIndex: number,
  config: LoadTestRequest,
  stats: Stats
): Promise<void> {
  const user = TEST_USERS[userIndex % TEST_USERS.length];
  const { baseUrl, requestsPerUser, delayMs, baseFunctionHeaders } = config;

  // Login
  const loginResponse = await safeFetch(
    `${baseUrl}/functions/v1/login-with-username-pin`,
    {
      method: 'POST',
      headers: baseFunctionHeaders || { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, pin: user.pin }),
    },
    stats
  );

  if (!loginResponse) return;

  const loginData = await loginResponse.json();
  const token = loginData?.session?.access_token;

  if (!token) return;

  const authHeaders = {
    ...(baseFunctionHeaders || {}),
    'Authorization': `Bearer ${token}`,
  };

  // Focus on rewards and leaderboard
  for (let i = 0; i < requestsPerUser; i++) {
    // Get wallet
    await safeFetch(
      `${baseUrl}/functions/v1/get-wallet`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      },
      stats
    );

    await sleep(delayMs);

    // Get daily leaderboard
    await safeFetch(
      `${baseUrl}/functions/v1/get-daily-leaderboard-by-country`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      },
      stats
    );

    await sleep(delayMs);

    // Get user game profile
    await safeFetch(
      `${baseUrl}/functions/v1/get-user-game-profile`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      },
      stats
    );

    await sleep(delayMs);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Base headers for all function calls (simulating client behavior)
    const baseFunctionHeaders = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    };

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: hasAdminRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ success: false, message: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body: LoadTestRequest = await req.json();
    let { baseUrl, vus, requestsPerUser, delayMs, scenario, mode } = body;

    // Security limits
    if (mode === 'test') {
      vus = Math.min(vus, 50);
      requestsPerUser = Math.min(requestsPerUser, 5);
    } else {
      vus = Math.min(vus, 5000);
      requestsPerUser = Math.min(requestsPerUser, 50);
    }

    // Setup realtime channel
    const channel = supabaseClient.channel('admin-load-test-progress');
    await channel.subscribe();

    const stats: Stats = {
      totalRequests: 0,
      success: 0,
      failed: 0,
      latencies: [],
      errors: [],
    };

    // Run load test
    const promises: Promise<void>[] = [];
    for (let i = 0; i < vus; i++) {
      if (scenario === 'A') {
        promises.push(scenarioAUserFlow(i, { ...body, vus, requestsPerUser, baseFunctionHeaders }, stats));
      } else if (scenario === 'B') {
        promises.push(scenarioBUserFlow(i, { ...body, vus, requestsPerUser, baseFunctionHeaders }, stats));
      } else if (scenario === 'C') {
        promises.push(scenarioCUserFlow(i, { ...body, vus, requestsPerUser, baseFunctionHeaders }, stats));
      }

      // Send progress every 100 users
      if (i > 0 && i % 100 === 0) {
        await channel.send({
          type: 'broadcast',
          event: 'progress',
          payload: {
            progressPercent: (i / vus) * 100,
            totalRequests: stats.totalRequests,
            success: stats.success,
            failed: stats.failed,
            lastError: stats.errors[stats.errors.length - 1] || null,
            vus,
            scenario,
            mode,
          },
        });
      }
    }

    const start = Date.now();
    await Promise.all(promises);
    const totalTimeSec = (Date.now() - start) / 1000;

    // Calculate percentiles
    const p50 = percentile(stats.latencies, 50);
    const p95 = percentile(stats.latencies, 95);
    const p99 = percentile(stats.latencies, 99);

    // Send done event
    await channel.send({
      type: 'broadcast',
      event: 'done',
      payload: {
        totalTimeSec,
        totalRequests: stats.totalRequests,
        success: stats.success,
        failed: stats.failed,
        p50,
        p95,
        p99,
        sampleErrors: stats.errors.slice(0, 5),
      },
    });

    await supabaseClient.removeChannel(channel);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Load test error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
