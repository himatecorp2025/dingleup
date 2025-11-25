import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LoadTestScenario = 'A' | 'B' | 'C';

interface LoadTestRequest {
  baseUrl: string;
  vus: number;
  requestsPerUser: number;
  delayMs: number;
  scenario: LoadTestScenario;
}

interface ErrorSample {
  url: string;
  status?: number;
  error?: string;
  bodySample?: string;
}

const stats = {
  totalRequests: 0,
  success: 0,
  failed: 0,
  latencies: [] as number[],
  errors: [] as ErrorSample[],
};

// Test users (must exist in database)
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((p / 100) * sorted.length);
  return sorted[Math.min(index, sorted.length - 1)];
}

async function safeFetch(
  url: string,
  options: RequestInit,
): Promise<any | null> {
  const start = performance.now();
  try {
    const res = await fetch(url, options);
    const duration = performance.now() - start;

    stats.totalRequests++;
    stats.latencies.push(duration);

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      stats.failed++;
      stats.errors.push({
        url,
        status: res.status,
        bodySample: bodyText.slice(0, 200),
      });
      return null;
    }

    stats.success++;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json().catch(() => null);
    }
    return await res.text().catch(() => null);
  } catch (err) {
    const duration = performance.now() - start;
    stats.totalRequests++;
    stats.latencies.push(duration);
    stats.failed++;
    stats.errors.push({
      url,
      error: String(err),
    });
    return null;
  }
}

// IMPORTANT: Adjust these endpoints to match your actual API routes
const ENDPOINTS = (baseUrl: string, anonKey: string) => {
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };
  
  return {
    login: {
      url: `${baseUrl}/functions/v1/login-with-username-pin`,
      headers,
    },
    startGame: {
      url: `${baseUrl}/functions/v1/start-game-session`,
      headers,
    },
    wallet: {
      url: `${baseUrl}/functions/v1/get-wallet`,
      headers,
    },
    leaderboard: {
      url: `${baseUrl}/functions/v1/get-daily-leaderboard-by-country`,
      headers,
    },
    gameProfile: {
      url: `${baseUrl}/functions/v1/get-user-game-profile`,
      headers,
    },
  };
};

async function scenarioAUserFlow(
  userIndex: number,
  config: LoadTestRequest,
  endpoints: ReturnType<typeof ENDPOINTS>,
  supabaseClient: any,
) {
  const user = TEST_USERS[userIndex % TEST_USERS.length];

  // Step 1: Call login-with-username-pin
  const loginRes = await safeFetch(endpoints.login.url, {
    method: 'POST',
    headers: endpoints.login.headers,
    body: JSON.stringify({ username: user.username, pin: user.pin }),
  });

  if (!loginRes?.success || !loginRes?.user?.email || !loginRes?.passwordVariants) {
    return;
  }

  // Step 2: Try signInWithPassword with passwordVariants
  let session = null;
  for (const password of loginRes.passwordVariants) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: loginRes.user.email,
      password: password,
    });
    
    if (data?.session) {
      session = data.session;
      break;
    }
  }

  if (!session?.access_token) return;

  const token = session.access_token;
  const authHeaders = {
    ...endpoints.login.headers,
    'Authorization': `Bearer ${token}`,
  };

  // User flow: start game, get wallet, get leaderboard
  for (let i = 0; i < config.requestsPerUser; i++) {
    await safeFetch(endpoints.startGame.url, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ category: 'general' }),
    });

    await sleep(config.delayMs);

    await safeFetch(endpoints.wallet.url, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });

    await sleep(config.delayMs);

    await safeFetch(endpoints.leaderboard.url, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });

    await sleep(config.delayMs);
  }
}

async function scenarioBUserFlow(
  userIndex: number,
  config: LoadTestRequest,
  endpoints: ReturnType<typeof ENDPOINTS>,
  supabaseClient: any,
) {
  const user = TEST_USERS[userIndex % TEST_USERS.length];

  // Step 1: Call login-with-username-pin
  const loginRes = await safeFetch(endpoints.login.url, {
    method: 'POST',
    headers: endpoints.login.headers,
    body: JSON.stringify({ username: user.username, pin: user.pin }),
  });

  if (!loginRes?.success || !loginRes?.user?.email || !loginRes?.passwordVariants) {
    return;
  }

  // Step 2: Try signInWithPassword with passwordVariants
  let session = null;
  for (const password of loginRes.passwordVariants) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: loginRes.user.email,
      password: password,
    });
    
    if (data?.session) {
      session = data.session;
      break;
    }
  }

  if (!session?.access_token) return;

  const token = session.access_token;
  const authHeaders = {
    ...endpoints.login.headers,
    'Authorization': `Bearer ${token}`,
  };

  // Simulate popup/failure scenarios
  for (let i = 0; i < config.requestsPerUser; i++) {
    const gameRes = await safeFetch(endpoints.startGame.url, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ category: 'general' }),
    });

    if (gameRes) {
      await sleep(config.delayMs);

      // Simulate wrong answers triggering popup logic
      await safeFetch(endpoints.wallet.url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      });
    }

    await sleep(config.delayMs);
  }
}

async function scenarioCUserFlow(
  userIndex: number,
  config: LoadTestRequest,
  endpoints: ReturnType<typeof ENDPOINTS>,
  supabaseClient: any,
) {
  const user = TEST_USERS[userIndex % TEST_USERS.length];

  // Step 1: Call login-with-username-pin
  const loginRes = await safeFetch(endpoints.login.url, {
    method: 'POST',
    headers: endpoints.login.headers,
    body: JSON.stringify({ username: user.username, pin: user.pin }),
  });

  if (!loginRes?.success || !loginRes?.user?.email || !loginRes?.passwordVariants) {
    return;
  }

  // Step 2: Try signInWithPassword with passwordVariants
  let session = null;
  for (const password of loginRes.passwordVariants) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: loginRes.user.email,
      password: password,
    });
    
    if (data?.session) {
      session = data.session;
      break;
    }
  }

  if (!session?.access_token) return;

  const token = session.access_token;
  const authHeaders = {
    ...endpoints.login.headers,
    'Authorization': `Bearer ${token}`,
  };

  // Focus on rewards and leaderboard
  for (let i = 0; i < config.requestsPerUser; i++) {
    await safeFetch(endpoints.wallet.url, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });

    await sleep(config.delayMs);

    await safeFetch(endpoints.gameProfile.url, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });

    await sleep(config.delayMs);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Parse and validate request
    const body: LoadTestRequest = await req.json();

    if (!body.baseUrl || !body.vus || !body.requestsPerUser || body.scenario === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request: missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security limits - increased for high-load capacity testing
    const vus = Math.max(10, Math.min(body.vus, 50000));
    const requestsPerUser = Math.max(1, Math.min(body.requestsPerUser, 100));
    const delayMs = Math.max(0, Math.min(body.delayMs, 5000));

    if (!['A', 'B', 'C'].includes(body.scenario)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid scenario: must be A, B, or C' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config: LoadTestRequest = {
      baseUrl: body.baseUrl,
      vus,
      requestsPerUser,
      delayMs,
      scenario: body.scenario,
    };

    // Reset stats
    stats.totalRequests = 0;
    stats.success = 0;
    stats.failed = 0;
    stats.latencies = [];
    stats.errors = [];

    // Create Supabase client for auth
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get endpoints
    const endpoints = ENDPOINTS(supabaseUrl, supabaseAnonKey);

    // Run load test
    const start = Date.now();
    const promises: Promise<void>[] = [];

    for (let i = 0; i < vus; i++) {
      if (config.scenario === 'A') {
        promises.push(scenarioAUserFlow(i, config, endpoints, supabaseClient));
      } else if (config.scenario === 'B') {
        promises.push(scenarioBUserFlow(i, config, endpoints, supabaseClient));
      } else if (config.scenario === 'C') {
        promises.push(scenarioCUserFlow(i, config, endpoints, supabaseClient));
      }
    }

    await Promise.all(promises);
    const totalTimeSec = (Date.now() - start) / 1000;

    // Calculate metrics
    const p50 = percentile(stats.latencies, 50);
    const p95 = percentile(stats.latencies, 95);
    const p99 = percentile(stats.latencies, 99);
    const errorRate = stats.totalRequests === 0 ? 0 : stats.failed / stats.totalRequests;

    // Return JSON report
    return new Response(
      JSON.stringify({
        success: true,
        config: {
          baseUrl: config.baseUrl,
          vus: config.vus,
          requestsPerUser: config.requestsPerUser,
          delayMs: config.delayMs,
          scenario: config.scenario,
        },
        summary: {
          totalTimeSec,
          totalRequests: stats.totalRequests,
          success: stats.success,
          failed: stats.failed,
          errorRate: (errorRate * 100).toFixed(2) + '%',
          p50Ms: p50.toFixed(2),
          p95Ms: p95.toFixed(2),
          p99Ms: p99.toFixed(2),
        },
        sampleErrors: stats.errors.slice(0, 5),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Load test error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
