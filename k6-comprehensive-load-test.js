import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// ============= CUSTOM METRICS =============
const failRate = new Rate('failed_requests');
const responseTrend = new Trend('response_time');
const authSuccessRate = new Rate('auth_success');
const ageGateSuccessRate = new Rate('age_gate_success');
const biometricSuccessRate = new Rate('biometric_login_success');
const emailPinLinkRate = new Rate('email_pin_link_success');
const gameStartRate = new Rate('game_start_success');
const answerSubmitRate = new Rate('answer_submit_success');
const leaderboardLoadRate = new Rate('leaderboard_load_success');
const dailyRewardRate = new Rate('daily_reward_claim_success');
const boosterPurchaseRate = new Rate('booster_purchase_success');
const profileUpdateRate = new Rate('profile_update_success');
const adminLoadRate = new Rate('admin_load_success');

// Endpoint-specific response time metrics
const loginResponseTime = new Trend('login_response_time');
const questionFetchTime = new Trend('question_fetch_time');
const answerSubmitTime = new Trend('answer_submit_time');
const leaderboardTime = new Trend('leaderboard_response_time');
const dailyRewardTime = new Trend('daily_reward_response_time');

// Counters
const totalGamesPlayed = new Counter('total_games_played');
const totalQuestionsAnswered = new Counter('total_questions_answered');
const totalCoinsEarned = new Counter('total_coins_earned');
const concurrentUsers = new Gauge('concurrent_active_users');

// ============= TEST CONFIGURATION =============
export const options = {
  scenarios: {
    // SCENARIO 1: Registration + Age Gate (100 -> 1000 users)
    registration_age_gate: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },    // Warm up
        { duration: '2m', target: 500 },    // Ramp to 500
        { duration: '2m', target: 1000 },   // Ramp to 1000
        { duration: '3m', target: 1000 },   // Sustain 1000
        { duration: '2m', target: 0 },      // Ramp down
      ],
      exec: 'registrationAgeGateFlow',
      startTime: '0s',
    },

    // SCENARIO 2: Login (Username+PIN + Biometric) (1000 -> 2500 users)
    login_mixed: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },
        { duration: '2m', target: 1000 },
        { duration: '2m', target: 2000 },
        { duration: '3m', target: 2500 },
        { duration: '3m', target: 2500 },   // Sustain
        { duration: '2m', target: 0 },
      ],
      exec: 'loginFlow',
      startTime: '1m',
    },

    // SCENARIO 3: Game Play (Heavy) (2000 -> 5000 users)
    game_heavy: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 1000 },
        { duration: '3m', target: 2500 },
        { duration: '3m', target: 4000 },
        { duration: '2m', target: 5000 },
        { duration: '5m', target: 5000 },   // Sustain peak
        { duration: '3m', target: 0 },
      ],
      exec: 'gamePlayFlow',
      startTime: '2m',
    },

    // SCENARIO 4: Leaderboard Queries (TOP100 country-specific) (1000 -> 3000 users)
    leaderboard_queries: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },
        { duration: '2m', target: 1500 },
        { duration: '3m', target: 3000 },
        { duration: '5m', target: 3000 },
        { duration: '2m', target: 0 },
      ],
      exec: 'leaderboardFlow',
      startTime: '3m',
    },

    // SCENARIO 5: Daily Rewards + Boosters (500 -> 1500 users)
    rewards_boosters: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },
        { duration: '3m', target: 1000 },
        { duration: '2m', target: 1500 },
        { duration: '5m', target: 1500 },
        { duration: '2m', target: 0 },
      ],
      exec: 'rewardsBoostersFlow',
      startTime: '4m',
    },

    // SCENARIO 6: Profile Operations (500 -> 1000 users)
    profile_ops: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 300 },
        { duration: '2m', target: 700 },
        { duration: '2m', target: 1000 },
        { duration: '4m', target: 1000 },
        { duration: '2m', target: 0 },
      ],
      exec: 'profileFlow',
      startTime: '5m',
    },

    // SCENARIO 7: Admin Interface (Light - 10 -> 50 users)
    admin_light: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '3m', target: 30 },
        { duration: '3m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      exec: 'adminFlow',
      startTime: '6m',
    },
  },

  thresholds: {
    // Overall HTTP thresholds
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'],     // 95% < 2s, 99% < 3s
    'http_req_failed': ['rate<0.01'],                       // < 1% error rate
    
    // Success rate thresholds
    'auth_success': ['rate>0.98'],                          // > 98% auth success
    'age_gate_success': ['rate>0.98'],
    'game_start_success': ['rate>0.95'],
    'leaderboard_load_success': ['rate>0.97'],
    'daily_reward_claim_success': ['rate>0.98'],
    
    // Endpoint-specific response times
    'login_response_time': ['p(95)<1000', 'p(99)<2000'],   // Login < 1s (P95)
    'question_fetch_time': ['p(95)<800', 'p(99)<1500'],    // Questions < 800ms
    'leaderboard_response_time': ['p(95)<1500', 'p(99)<2500'], // Leaderboard < 1.5s
    'daily_reward_response_time': ['p(95)<1000', 'p(99)<1800'],
  },
};

// ============= CONFIGURATION =============
const BASE_URL = __ENV.BASE_URL || 'https://wdpxmwsxhckazwxufttk.supabase.co';
const ANON_KEY = __ENV.ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcHhtd3N4aGNrYXp3eHVmdHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDQ3ODUsImV4cCI6MjA3NjE4MDc4NX0.DeAS4ACvq-YVt2ytoOS3NVSg7xFSHVhvyjUEOti_NnA';

const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
};

// Country codes for realistic leaderboard queries
const COUNTRIES = ['HU', 'US', 'DE', 'FR', 'ES', 'IT', 'PT', 'NL', 'GB', 'PL'];

// ============= HELPER FUNCTIONS =============

function generateUsername() {
  return `loadtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generatePIN() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit PIN
}

function generateDOB() {
  // Generate DOB for 18-50 year old users
  const age = 18 + Math.floor(Math.random() * 32);
  const year = new Date().getFullYear() - age;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function registerUserWithPIN() {
  const username = generateUsername();
  const pin = generatePIN();
  const country_code = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

  const payload = JSON.stringify({ username, pin, country_code });

  const res = http.post(
    `${BASE_URL}/functions/v1/register-with-username-pin`,
    payload,
    { headers }
  );

  const success = check(res, {
    'registration successful': (r) => r.status === 200,
  });

  authSuccessRate.add(success);
  failRate.add(!success);
  responseTrend.add(res.timings.duration);

  if (success) {
    const body = res.json();
    return {
      username,
      pin,
      userId: body.userId,
      country_code,
    };
  }

  return null;
}

function loginWithPIN(username, pin) {
  const payload = JSON.stringify({ username, pin });

  const startTime = new Date().getTime();
  const res = http.post(
    `${BASE_URL}/functions/v1/login-with-username-pin`,
    payload,
    { headers }
  );
  const endTime = new Date().getTime();

  loginResponseTime.add(endTime - startTime);

  const success = check(res, {
    'login successful': (r) => r.status === 200,
  });

  authSuccessRate.add(success);

  if (success) {
    const body = res.json();
    // Return first password variant for sign-in
    return body.passwordVariants && body.passwordVariants[0];
  }

  return null;
}

function submitAgeGate(token, userId) {
  const dob = generateDOB();
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${token}`,
  };

  const payload = JSON.stringify({ dob });

  const res = http.post(
    `${BASE_URL}/functions/v1/submit-dob`,
    payload,
    { headers: authHeaders }
  );

  const success = check(res, {
    'age gate submitted': (r) => r.status === 200,
  });

  ageGateSuccessRate.add(success);
  return success;
}

// ============= SCENARIO FLOWS =============

// SCENARIO 1: Registration + Age Gate
export function registrationAgeGateFlow() {
  concurrentUsers.add(1);

  group('Registration + Age Gate', () => {
    // Step 1: Register with username + PIN
    const user = registerUserWithPIN();
    if (!user) {
      sleep(1);
      return;
    }

    sleep(0.5);

    // Step 2: Login to get token
    const password = loginWithPIN(user.username, user.pin);
    if (!password) {
      sleep(1);
      return;
    }

    // Step 3: Supabase sign-in with email+password
    const signInPayload = JSON.stringify({
      email: `${user.username}@dingleup.local`,
      password,
    });

    const signInRes = http.post(
      `${BASE_URL}/auth/v1/token?grant_type=password`,
      signInPayload,
      { headers }
    );

    if (signInRes.status === 200) {
      const token = signInRes.json('access_token');
      
      sleep(0.3);

      // Step 4: Submit age gate
      submitAgeGate(token, user.userId);
    }

    sleep(Math.random() * 2 + 1); // 1-3s
  });
}

// SCENARIO 2: Login Flow (Mixed PIN + Biometric simulation)
export function loginFlow() {
  concurrentUsers.add(1);

  group('Login Flow', () => {
    const user = registerUserWithPIN();
    if (!user) return;

    sleep(0.3);

    // 70% PIN login, 30% biometric simulation
    const useBiometric = Math.random() < 0.3;

    if (useBiometric) {
      // Simulate biometric login (mock - real biometric requires WebAuthn setup)
      const biometricPayload = JSON.stringify({
        username: user.username,
        // Mock credential
        credential: {
          id: 'mock-credential-id',
          response: { authenticatorData: 'mock', signature: 'mock' }
        }
      });

      const bioRes = http.post(
        `${BASE_URL}/functions/v1/verify-webauthn-authentication`,
        biometricPayload,
        { headers }
      );

      const success = bioRes.status === 200;
      biometricSuccessRate.add(success);
    } else {
      // Standard PIN login
      loginWithPIN(user.username, user.pin);
    }

    sleep(Math.random() * 2 + 1);
  });
}

// SCENARIO 3: Game Play Flow
export function gamePlayFlow() {
  concurrentUsers.add(1);

  group('Game Play', () => {
    const user = registerUserWithPIN();
    if (!user) return;

    const password = loginWithPIN(user.username, user.pin);
    if (!password) return;

    const signInPayload = JSON.stringify({
      email: `${user.username}@dingleup.local`,
      password,
    });

    const signInRes = http.post(
      `${BASE_URL}/auth/v1/token?grant_type=password`,
      signInPayload,
      { headers }
    );

    if (signInRes.status !== 200) return;

    const token = signInRes.json('access_token');
    const authHeaders = {
      ...headers,
      'Authorization': `Bearer ${token}`,
    };

    submitAgeGate(token, user.userId);

    sleep(0.5);

    // Start game session
    const categories = ['culture', 'finance', 'health', 'history', 'technology', 'sports', 'science'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    const gamePayload = JSON.stringify({ category });

    const startTime = new Date().getTime();
    const gameRes = http.post(
      `${BASE_URL}/functions/v1/start-game-session`,
      gamePayload,
      { headers: authHeaders }
    );
    const endTime = new Date().getTime();

    questionFetchTime.add(endTime - startTime);

    const gameSuccess = check(gameRes, {
      'game started': (r) => r.status === 200,
    });

    gameStartRate.add(gameSuccess);

    if (gameSuccess) {
      const gameData = gameRes.json();
      totalGamesPlayed.add(1);

      // Simulate answering 5 questions (realistic gameplay)
      for (let i = 0; i < 5; i++) {
        sleep(Math.random() * 4 + 2); // 2-6s per question (realistic)

        const answerPayload = JSON.stringify({
          sessionId: gameData.sessionId,
          questionIndex: i,
          selectedAnswer: Math.floor(Math.random() * 4),
          responseTime: Math.random() * 8000 + 2000, // 2-10s
        });

        const answerStartTime = new Date().getTime();
        const answerRes = http.post(
          `${BASE_URL}/functions/v1/complete-game`,
          answerPayload,
          { headers: authHeaders }
        );
        const answerEndTime = new Date().getTime();

        answerSubmitTime.add(answerEndTime - answerStartTime);

        const answerSuccess = answerRes.status === 200;
        answerSubmitRate.add(answerSuccess);

        if (answerSuccess) {
          totalQuestionsAnswered.add(1);
          totalCoinsEarned.add(Math.floor(Math.random() * 5) + 1); // 1-5 coins per answer
        }
      }
    }

    sleep(Math.random() * 3 + 1);
  });
}

// SCENARIO 4: Leaderboard Queries
export function leaderboardFlow() {
  concurrentUsers.add(1);

  group('Leaderboard', () => {
    const user = registerUserWithPIN();
    if (!user) return;

    const password = loginWithPIN(user.username, user.pin);
    if (!password) return;

    const signInPayload = JSON.stringify({
      email: `${user.username}@dingleup.local`,
      password,
    });

    const signInRes = http.post(
      `${BASE_URL}/auth/v1/token?grant_type=password`,
      signInPayload,
      { headers }
    );

    if (signInRes.status !== 200) return;

    const token = signInRes.json('access_token');
    const authHeaders = {
      ...headers,
      'Authorization': `Bearer ${token}`,
    };

    sleep(0.5);

    // Query daily leaderboard (country-specific TOP 100)
    const leaderboardPayload = JSON.stringify({
      country_code: user.country_code,
    });

    const lbStartTime = new Date().getTime();
    const lbRes = http.post(
      `${BASE_URL}/functions/v1/get-daily-leaderboard-by-country`,
      leaderboardPayload,
      { headers: authHeaders }
    );
    const lbEndTime = new Date().getTime();

    leaderboardTime.add(lbEndTime - lbStartTime);

    const lbSuccess = check(lbRes, {
      'leaderboard loaded': (r) => r.status === 200,
    });

    leaderboardLoadRate.add(lbSuccess);

    sleep(Math.random() * 2 + 1);
  });
}

// SCENARIO 5: Daily Rewards + Boosters
export function rewardsBoostersFlow() {
  concurrentUsers.add(1);

  group('Rewards & Boosters', () => {
    const user = registerUserWithPIN();
    if (!user) return;

    const password = loginWithPIN(user.username, user.pin);
    if (!password) return;

    const signInPayload = JSON.stringify({
      email: `${user.username}@dingleup.local`,
      password,
    });

    const signInRes = http.post(
      `${BASE_URL}/auth/v1/token?grant_type=password`,
      signInPayload,
      { headers }
    );

    if (signInRes.status !== 200) return;

    const token = signInRes.json('access_token');
    const authHeaders = {
      ...headers,
      'Authorization': `Bearer ${token}`,
    };

    submitAgeGate(token, user.userId);

    sleep(0.5);

    // Claim daily reward (50% of users)
    if (Math.random() < 0.5) {
      const rewardStartTime = new Date().getTime();
      const rewardRes = http.post(
        `${BASE_URL}/functions/v1/claim-daily-gift`,
        null,
        { headers: authHeaders }
      );
      const rewardEndTime = new Date().getTime();

      dailyRewardTime.add(rewardEndTime - rewardStartTime);

      const rewardSuccess = rewardRes.status === 200;
      dailyRewardRate.add(rewardSuccess);
    }

    sleep(0.5);

    // Purchase booster (20% of users)
    if (Math.random() < 0.2) {
      const boosterPayload = JSON.stringify({
        booster_type: 'free_booster', // Use free booster for testing
        purchase_source: 'shop',
      });

      const boosterRes = http.post(
        `${BASE_URL}/functions/v1/purchase-booster`,
        boosterPayload,
        { headers: authHeaders }
      );

      const boosterSuccess = boosterRes.status === 200;
      boosterPurchaseRate.add(boosterSuccess);
    }

    sleep(Math.random() * 2 + 1);
  });
}

// SCENARIO 6: Profile Operations
export function profileFlow() {
  concurrentUsers.add(1);

  group('Profile Operations', () => {
    const user = registerUserWithPIN();
    if (!user) return;

    const password = loginWithPIN(user.username, user.pin);
    if (!password) return;

    const signInPayload = JSON.stringify({
      email: `${user.username}@dingleup.local`,
      password,
    });

    const signInRes = http.post(
      `${BASE_URL}/auth/v1/token?grant_type=password`,
      signInPayload,
      { headers }
    );

    if (signInRes.status !== 200) return;

    const token = signInRes.json('access_token');
    const authHeaders = {
      ...headers,
      'Authorization': `Bearer ${token}`,
    };

    sleep(0.5);

    // Load profile
    const profileRes = http.get(
      `${BASE_URL}/rest/v1/profiles?id=eq.${user.userId}&select=*`,
      { headers: authHeaders }
    );

    check(profileRes, {
      'profile loaded': (r) => r.status === 200,
    });

    sleep(0.5);

    // Update username (simulating weekly limit logic - 10% of users)
    if (Math.random() < 0.1) {
      const newUsername = generateUsername();
      const updatePayload = JSON.stringify({ newUsername });

      const updateRes = http.post(
        `${BASE_URL}/functions/v1/update-username`,
        updatePayload,
        { headers: authHeaders }
      );

      const updateSuccess = updateRes.status === 200;
      profileUpdateRate.add(updateSuccess);
    }

    // Email + PIN linking (30% of users)
    if (Math.random() < 0.3) {
      const email = `${user.username}@test.com`;
      const linkPayload = JSON.stringify({ email, pin: user.pin });

      const linkRes = http.post(
        `${BASE_URL}/functions/v1/link-email-pin`,
        linkPayload,
        { headers: authHeaders }
      );

      const linkSuccess = linkRes.status === 200;
      emailPinLinkRate.add(linkSuccess);
    }

    sleep(Math.random() * 2 + 1);
  });
}

// SCENARIO 7: Admin Interface (Light load)
export function adminFlow() {
  group('Admin Interface', () => {
    // Admin login (mock - use existing admin credentials)
    const adminEmail = 'admin@dingleup.com'; // Placeholder
    const adminPassword = 'admin-password'; // Placeholder

    const adminPayload = JSON.stringify({
      email: adminEmail,
      password: adminPassword,
    });

    const adminLoginRes = http.post(
      `${BASE_URL}/auth/v1/token?grant_type=password`,
      adminPayload,
      { headers }
    );

    if (adminLoginRes.status !== 200) {
      sleep(5);
      return;
    }

    const token = adminLoginRes.json('access_token');
    const authHeaders = {
      ...headers,
      'Authorization': `Bearer ${token}`,
    };

    sleep(1);

    // Load admin dashboard stats
    const statsRes = http.post(
      `${BASE_URL}/functions/v1/admin-all-data`,
      null,
      { headers: authHeaders }
    );

    const statsSuccess = statsRes.status === 200;
    adminLoadRate.add(statsSuccess);

    sleep(2);

    // Load translations list (lightweight query)
    const translationsRes = http.post(
      `${BASE_URL}/functions/v1/get-translations`,
      JSON.stringify({ language: 'en' }),
      { headers: authHeaders }
    );

    check(translationsRes, {
      'translations loaded': (r) => r.status === 200,
    });

    sleep(Math.random() * 5 + 3); // 3-8s
  });
}

// ============= SUMMARY HANDLER =============
export function handleSummary(data) {
  return {
    'load-test-summary.html': htmlReport(data),
    'load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function htmlReport(data) {
  const metrics = data.metrics;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>DingleUP! Comprehensive Load Test Results</title>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      color: #333;
    }
    .container { 
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%);
      padding: 40px;
      text-align: center;
      color: white;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
    .header p { font-size: 1.1em; opacity: 0.95; }
    
    .content { padding: 40px; }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .metric-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    
    .metric-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    }
    
    .metric-card h3 {
      font-size: 0.9em;
      color: #555;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .metric-card .value {
      font-size: 2.2em;
      font-weight: bold;
      color: #667eea;
    }
    
    .metric-card .sub {
      font-size: 0.85em;
      color: #777;
      margin-top: 5px;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      font-size: 1.8em;
      margin-bottom: 20px;
      color: #D4AF37;
      border-bottom: 3px solid #D4AF37;
      padding-bottom: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    th, td {
      padding: 15px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.85em;
      letter-spacing: 0.5px;
    }
    
    tr:nth-child(even) { background: #f9f9f9; }
    tr:hover { background: #f0f0f0; }
    
    .pass { 
      color: #27ae60;
      font-weight: bold;
      font-size: 1.1em;
    }
    
    .fail { 
      color: #e74c3c;
      font-weight: bold;
      font-size: 1.1em;
    }
    
    .warning {
      color: #f39c12;
      font-weight: bold;
      font-size: 1.1em;
    }
    
    .status-badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
    }
    
    .status-pass {
      background: #27ae60;
      color: white;
    }
    
    .status-fail {
      background: #e74c3c;
      color: white;
    }
    
    .footer {
      background: #2c3e50;
      color: white;
      padding: 20px;
      text-align: center;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 DingleUP! Comprehensive Load Test</h1>
      <p>Target: 10,000 concurrent users/minute</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="content">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="metric-card">
          <h3>Total Requests</h3>
          <div class="value">${metrics.http_reqs?.values?.count || 0}</div>
          <div class="sub">HTTP calls made</div>
        </div>
        
        <div class="metric-card">
          <h3>Failed Requests</h3>
          <div class="value" style="color: ${(metrics.http_req_failed?.values?.rate || 0) < 0.01 ? '#27ae60' : '#e74c3c'}">
            ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%
          </div>
          <div class="sub">Target: < 1%</div>
        </div>
        
        <div class="metric-card">
          <h3>Avg Response Time</h3>
          <div class="value">${(metrics.http_req_duration?.values?.avg || 0).toFixed(0)}ms</div>
          <div class="sub">Mean latency</div>
        </div>
        
        <div class="metric-card">
          <h3>P95 Response Time</h3>
          <div class="value" style="color: ${(metrics.http_req_duration?.values?.['p(95)'] || 0) < 2000 ? '#27ae60' : '#e74c3c'}">
            ${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(0)}ms
          </div>
          <div class="sub">Target: < 2000ms</div>
        </div>
        
        <div class="metric-card">
          <h3>P99 Response Time</h3>
          <div class="value" style="color: ${(metrics.http_req_duration?.values?.['p(99)'] || 0) < 3000 ? '#27ae60' : '#f39c12'}">
            ${(metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(0)}ms
          </div>
          <div class="sub">Target: < 3000ms</div>
        </div>
        
        <div class="metric-card">
          <h3>Total Games Played</h3>
          <div class="value">${metrics.total_games_played?.values?.count || 0}</div>
          <div class="sub">Game sessions</div>
        </div>
        
        <div class="metric-card">
          <h3>Questions Answered</h3>
          <div class="value">${metrics.total_questions_answered?.values?.count || 0}</div>
          <div class="sub">In-game actions</div>
        </div>
        
        <div class="metric-card">
          <h3>Coins Earned</h3>
          <div class="value">${metrics.total_coins_earned?.values?.count || 0}</div>
          <div class="sub">Virtual currency</div>
        </div>
      </div>
      
      <!-- Threshold Results -->
      <div class="section">
        <h2>✅ Threshold Pass/Fail Status</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Threshold</th>
              <th>Actual Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${generateThresholdRows(metrics)}
          </tbody>
        </table>
      </div>
      
      <!-- Endpoint-Specific Performance -->
      <div class="section">
        <h2>⚡ Endpoint-Specific Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Avg (ms)</th>
              <th>P95 (ms)</th>
              <th>P99 (ms)</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Login (PIN)</strong></td>
              <td>${(metrics.login_response_time?.values?.avg || 0).toFixed(0)}</td>
              <td>${(metrics.login_response_time?.values?.['p(95)'] || 0).toFixed(0)}</td>
              <td>${(metrics.login_response_time?.values?.['p(99)'] || 0).toFixed(0)}</td>
              <td class="${(metrics.auth_success?.values?.rate || 0) > 0.98 ? 'pass' : 'fail'}">
                ${((metrics.auth_success?.values?.rate || 0) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td><strong>Question Fetch</strong></td>
              <td>${(metrics.question_fetch_time?.values?.avg || 0).toFixed(0)}</td>
              <td>${(metrics.question_fetch_time?.values?.['p(95)'] || 0).toFixed(0)}</td>
              <td>${(metrics.question_fetch_time?.values?.['p(99)'] || 0).toFixed(0)}</td>
              <td class="${(metrics.game_start_success?.values?.rate || 0) > 0.95 ? 'pass' : 'fail'}">
                ${((metrics.game_start_success?.values?.rate || 0) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td><strong>Answer Submit</strong></td>
              <td>${(metrics.answer_submit_time?.values?.avg || 0).toFixed(0)}</td>
              <td>${(metrics.answer_submit_time?.values?.['p(95)'] || 0).toFixed(0)}</td>
              <td>${(metrics.answer_submit_time?.values?.['p(99)'] || 0).toFixed(0)}</td>
              <td class="${(metrics.answer_submit_success?.values?.rate || 0) > 0.95 ? 'pass' : 'fail'}">
                ${((metrics.answer_submit_success?.values?.rate || 0) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td><strong>Leaderboard Query</strong></td>
              <td>${(metrics.leaderboard_response_time?.values?.avg || 0).toFixed(0)}</td>
              <td>${(metrics.leaderboard_response_time?.values?.['p(95)'] || 0).toFixed(0)}</td>
              <td>${(metrics.leaderboard_response_time?.values?.['p(99)'] || 0).toFixed(0)}</td>
              <td class="${(metrics.leaderboard_load_success?.values?.rate || 0) > 0.97 ? 'pass' : 'fail'}">
                ${((metrics.leaderboard_load_success?.values?.rate || 0) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td><strong>Daily Reward Claim</strong></td>
              <td>${(metrics.daily_reward_response_time?.values?.avg || 0).toFixed(0)}</td>
              <td>${(metrics.daily_reward_response_time?.values?.['p(95)'] || 0).toFixed(0)}</td>
              <td>${(metrics.daily_reward_response_time?.values?.['p(99)'] || 0).toFixed(0)}</td>
              <td class="${(metrics.daily_reward_claim_success?.values?.rate || 0) > 0.98 ? 'pass' : 'fail'}">
                ${((metrics.daily_reward_claim_success?.values?.rate || 0) * 100).toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Feature Success Rates -->
      <div class="section">
        <h2>📊 Feature-Level Success Rates</h2>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Success Rate</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Age Gate Submission</td>
              <td class="${(metrics.age_gate_success?.values?.rate || 0) > 0.98 ? 'pass' : 'fail'}">
                ${((metrics.age_gate_success?.values?.rate || 0) * 100).toFixed(2)}%
              </td>
              <td>> 98%</td>
              <td>
                <span class="status-badge ${(metrics.age_gate_success?.values?.rate || 0) > 0.98 ? 'status-pass' : 'status-fail'}">
                  ${(metrics.age_gate_success?.values?.rate || 0) > 0.98 ? '✓ PASS' : '✗ FAIL'}
                </span>
              </td>
            </tr>
            <tr>
              <td>Biometric Login</td>
              <td class="${(metrics.biometric_login_success?.values?.rate || 0) > 0.95 ? 'pass' : 'warning'}">
                ${((metrics.biometric_login_success?.values?.rate || 0) * 100).toFixed(2)}%
              </td>
              <td>> 95%</td>
              <td>
                <span class="status-badge ${(metrics.biometric_login_success?.values?.rate || 0) > 0.95 ? 'status-pass' : 'status-fail'}">
                  ${(metrics.biometric_login_success?.values?.rate || 0) > 0.95 ? '✓ PASS' : '✗ FAIL'}
                </span>
              </td>
            </tr>
            <tr>
              <td>Email+PIN Linking</td>
              <td class="${(metrics.email_pin_link_success?.values?.rate || 0) > 0.95 ? 'pass' : 'warning'}">
                ${((metrics.email_pin_link_success?.values?.rate || 0) * 100).toFixed(2)}%
              </td>
              <td>> 95%</td>
              <td>
                <span class="status-badge ${(metrics.email_pin_link_success?.values?.rate || 0) > 0.95 ? 'status-pass' : 'status-fail'}">
                  ${(metrics.email_pin_link_success?.values?.rate || 0) > 0.95 ? '✓ PASS' : '✗ FAIL'}
                </span>
              </td>
            </tr>
            <tr>
              <td>Booster Purchase</td>
              <td class="${(metrics.booster_purchase_success?.values?.rate || 0) > 0.95 ? 'pass' : 'warning'}">
                ${((metrics.booster_purchase_success?.values?.rate || 0) * 100).toFixed(2)}%
              </td>
              <td>> 95%</td>
              <td>
                <span class="status-badge ${(metrics.booster_purchase_success?.values?.rate || 0) > 0.95 ? 'status-pass' : 'status-fail'}">
                  ${(metrics.booster_purchase_success?.values?.rate || 0) > 0.95 ? '✓ PASS' : '✗ FAIL'}
                </span>
              </td>
            </tr>
            <tr>
              <td>Profile Update</td>
              <td class="${(metrics.profile_update_success?.values?.rate || 0) > 0.95 ? 'pass' : 'warning'}">
                ${((metrics.profile_update_success?.values?.rate || 0) * 100).toFixed(2)}%
              </td>
              <td>> 95%</td>
              <td>
                <span class="status-badge ${(metrics.profile_update_success?.values?.rate || 0) > 0.95 ? 'status-pass' : 'status-fail'}">
                  ${(metrics.profile_update_success?.values?.rate || 0) > 0.95 ? '✓ PASS' : '✗ FAIL'}
                </span>
              </td>
            </tr>
            <tr>
              <td>Admin Interface Load</td>
              <td class="${(metrics.admin_load_success?.values?.rate || 0) > 0.90 ? 'pass' : 'warning'}">
                ${((metrics.admin_load_success?.values?.rate || 0) * 100).toFixed(2)}%
              </td>
              <td>> 90%</td>
              <td>
                <span class="status-badge ${(metrics.admin_load_success?.values?.rate || 0) > 0.90 ? 'status-pass' : 'status-fail'}">
                  ${(metrics.admin_load_success?.values?.rate || 0) > 0.90 ? '✓ PASS' : '✗ FAIL'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>DingleUP! Load Testing Framework v2.0</strong></p>
      <p>Comprehensive 10,000 user/minute capacity test</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateThresholdRows(metrics) {
  let rows = '';
  
  const thresholds = [
    { 
      name: 'HTTP Request Duration (P95)', 
      threshold: '< 2000ms', 
      actual: `${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(0)}ms`,
      pass: (metrics.http_req_duration?.values?.['p(95)'] || 0) < 2000
    },
    { 
      name: 'HTTP Request Duration (P99)', 
      threshold: '< 3000ms', 
      actual: `${(metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(0)}ms`,
      pass: (metrics.http_req_duration?.values?.['p(99)'] || 0) < 3000
    },
    { 
      name: 'HTTP Request Failed Rate', 
      threshold: '< 1%', 
      actual: `${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%`,
      pass: (metrics.http_req_failed?.values?.rate || 0) < 0.01
    },
    { 
      name: 'Auth Success Rate', 
      threshold: '> 98%', 
      actual: `${((metrics.auth_success?.values?.rate || 0) * 100).toFixed(2)}%`,
      pass: (metrics.auth_success?.values?.rate || 0) > 0.98
    },
    { 
      name: 'Game Start Success Rate', 
      threshold: '> 95%', 
      actual: `${((metrics.game_start_success?.values?.rate || 0) * 100).toFixed(2)}%`,
      pass: (metrics.game_start_success?.values?.rate || 0) > 0.95
    },
    { 
      name: 'Leaderboard Load Success', 
      threshold: '> 97%', 
      actual: `${((metrics.leaderboard_load_success?.values?.rate || 0) * 100).toFixed(2)}%`,
      pass: (metrics.leaderboard_load_success?.values?.rate || 0) > 0.97
    },
  ];
  
  thresholds.forEach(t => {
    rows += `
      <tr>
        <td><strong>${t.name}</strong></td>
        <td>${t.threshold}</td>
        <td class="${t.pass ? 'pass' : 'fail'}">${t.actual}</td>
        <td>
          <span class="status-badge ${t.pass ? 'status-pass' : 'status-fail'}">
            ${t.pass ? '✓ PASS' : '✗ FAIL'}
          </span>
        </td>
      </tr>
    `;
  });
  
  return rows;
}

function textSummary(data) {
  const metrics = data.metrics;
  
  let output = '\n' + '='.repeat(80) + '\n';
  output += '  🎮 DINGLEUP! COMPREHENSIVE LOAD TEST SUMMARY\n';
  output += '  Target: 10,000 concurrent users/minute\n';
  output += '='.repeat(80) + '\n\n';
  
  output += '📊 OVERALL METRICS:\n';
  output += `  Total Requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  output += `  Failed Requests: ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}% (Target: < 1%)\n`;
  output += `  Avg Response Time: ${(metrics.http_req_duration?.values?.avg || 0).toFixed(0)}ms\n`;
  output += `  P95 Response Time: ${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(0)}ms (Target: < 2000ms)\n`;
  output += `  P99 Response Time: ${(metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(0)}ms (Target: < 3000ms)\n\n`;
  
  output += '🎯 SUCCESS RATES:\n';
  output += `  Auth Success: ${((metrics.auth_success?.values?.rate || 0) * 100).toFixed(2)}% (Target: > 98%)\n`;
  output += `  Age Gate: ${((metrics.age_gate_success?.values?.rate || 0) * 100).toFixed(2)}% (Target: > 98%)\n`;
  output += `  Game Start: ${((metrics.game_start_success?.values?.rate || 0) * 100).toFixed(2)}% (Target: > 95%)\n`;
  output += `  Leaderboard: ${((metrics.leaderboard_load_success?.values?.rate || 0) * 100).toFixed(2)}% (Target: > 97%)\n`;
  output += `  Daily Rewards: ${((metrics.daily_reward_claim_success?.values?.rate || 0) * 100).toFixed(2)}% (Target: > 98%)\n\n`;
  
  output += '🎮 GAME STATS:\n';
  output += `  Total Games Played: ${metrics.total_games_played?.values?.count || 0}\n`;
  output += `  Questions Answered: ${metrics.total_questions_answered?.values?.count || 0}\n`;
  output += `  Coins Earned: ${metrics.total_coins_earned?.values?.count || 0}\n\n`;
  
  output += '⚡ ENDPOINT PERFORMANCE:\n';
  output += `  Login P95: ${(metrics.login_response_time?.values?.['p(95)'] || 0).toFixed(0)}ms (Target: < 1000ms)\n`;
  output += `  Question Fetch P95: ${(metrics.question_fetch_time?.values?.['p(95)'] || 0).toFixed(0)}ms (Target: < 800ms)\n`;
  output += `  Answer Submit P95: ${(metrics.answer_submit_time?.values?.['p(95)'] || 0).toFixed(0)}ms\n`;
  output += `  Leaderboard P95: ${(metrics.leaderboard_response_time?.values?.['p(95)'] || 0).toFixed(0)}ms (Target: < 1500ms)\n\n`;
  
  output += '='.repeat(80) + '\n';
  output += `📄 Detailed HTML report: load-test-summary.html\n`;
  output += `📊 JSON data: load-test-summary.json\n`;
  output += '='.repeat(80) + '\n\n';
  
  return output;
}
