import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// ========================================
// KONFIGURÁCIÓ
// ========================================

const BASE_URL = __ENV.BASE_URL || 'https://wdpxmwsxhckazwxufttk.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

// Terhelési paraméterek (környezeti változókból felülírhatók)
const TARGET_VUS = parseInt(__ENV.TARGET_VUS || '500');
const RAMP_UP_DURATION = __ENV.RAMP_UP_DURATION || '60s';
const HOLD_DURATION = __ENV.HOLD_DURATION || '120s';
const RAMP_DOWN_DURATION = __ENV.RAMP_DOWN_DURATION || '30s';

// ========================================
// METRIKÁK
// ========================================

const loginSuccess = new Rate('login_success_rate');
const gameStartSuccess = new Rate('game_start_success_rate');
const answerSuccess = new Rate('answer_success_rate');
const walletSuccess = new Rate('wallet_success_rate');
const leaderboardSuccess = new Rate('leaderboard_success_rate');

const loginDuration = new Trend('login_duration');
const gameStartDuration = new Trend('game_start_duration');
const answerDuration = new Trend('answer_duration');
const walletDuration = new Trend('wallet_duration');
const leaderboardDuration = new Trend('leaderboard_duration');

const errors5xx = new Counter('errors_5xx');
const errors4xx = new Counter('errors_4xx');
const timeouts = new Counter('timeouts');

// ========================================
// TESZT FELHASZNÁLÓK
// ========================================

// 100 pre-seeded teszt user (ezeket előre létre kell hozni az adatbázisban)
const testUsers = new SharedArray('users', function () {
  const users = [];
  for (let i = 0; i < 100; i++) {
    users.push({
      username: `loadtest_user_${String(i).padStart(3, '0')}`,
      pin: '123456',
    });
  }
  return users;
});

// ========================================
// K6 OPCIÓK
// ========================================

export const options = {
  stages: [
    { duration: RAMP_UP_DURATION, target: TARGET_VUS }, // Ramp-up
    { duration: HOLD_DURATION, target: TARGET_VUS },    // Hold
    { duration: RAMP_DOWN_DURATION, target: 0 },        // Ramp-down
  ],
  thresholds: {
    // Sikerkritériumok
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],   // p95 < 500ms, p99 < 1000ms
    'http_req_failed': ['rate<0.01'],                    // < 1% failed requests
    'login_success_rate': ['rate>0.99'],                 // > 99% sikeres login
    'game_start_success_rate': ['rate>0.99'],            // > 99% sikeres game start
    'answer_success_rate': ['rate>0.99'],                // > 99% sikeres answer
    'errors_5xx': ['count<100'],                         // < 100 darab 5xx hiba
  },
  ext: {
    loadimpact: {
      projectID: 3630696,
      name: `DingleUP Load Test - ${TARGET_VUS} VUs`,
    },
  },
};

// ========================================
// SETUP
// ========================================

export function setup() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  DingleUP! Load Test Starting                              ║
╠════════════════════════════════════════════════════════════╣
║  Target VUs:       ${TARGET_VUS.toString().padEnd(40)}║
║  Ramp-up:          ${RAMP_UP_DURATION.padEnd(40)}║
║  Hold duration:    ${HOLD_DURATION.padEnd(40)}║
║  Base URL:         ${BASE_URL.padEnd(40).substring(0, 40)}║
╚════════════════════════════════════════════════════════════╝
  `);

  // Preflight check
  const healthCheck = http.get(`${BASE_URL}/health`, {
    headers: { 'apikey': SUPABASE_ANON_KEY },
    timeout: '10s',
  });

  if (healthCheck.status !== 200 && healthCheck.status !== 404) {
    console.warn(`⚠️  Health check returned status ${healthCheck.status}`);
  }

  return { baseUrl: BASE_URL, anonKey: SUPABASE_ANON_KEY };
}

// ========================================
// FŐ TESZT LOGIKA
// ========================================

export default function (data) {
  const { baseUrl, anonKey } = data;

  // Random teszt user kiválasztása
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  const headers = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
  };

  // ========================================
  // 1. LOGIN
  // ========================================

  const loginPayload = JSON.stringify({
    username: user.username,
    pin: user.pin,
  });

  const loginRes = http.post(
    `${baseUrl}/functions/v1/login-with-username-pin`,
    loginPayload,
    { headers, timeout: '10s', tags: { name: 'login' } }
  );

  loginDuration.add(loginRes.timings.duration);

  const loginOk = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has access_token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.session && body.session.access_token;
      } catch (e) {
        return false;
      }
    },
  });

  loginSuccess.add(loginOk);

  if (!loginOk) {
    if (loginRes.status >= 500) errors5xx.add(1);
    if (loginRes.status >= 400 && loginRes.status < 500) errors4xx.add(1);
    if (loginRes.status === 0) timeouts.add(1);
    return; // Skip rest of test
  }

  const authToken = JSON.parse(loginRes.body).session.access_token;
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${authToken}`,
  };

  sleep(0.5); // Think time

  // ========================================
  // 2. GET WALLET
  // ========================================

  const walletRes = http.post(
    `${baseUrl}/functions/v1/get-wallet`,
    JSON.stringify({}),
    { headers: authHeaders, timeout: '10s', tags: { name: 'wallet' } }
  );

  walletDuration.add(walletRes.timings.duration);

  const walletOk = check(walletRes, {
    'wallet status 200': (r) => r.status === 200,
    'wallet has coins': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.coins === 'number';
      } catch (e) {
        return false;
      }
    },
  });

  walletSuccess.add(walletOk);

  if (!walletOk) {
    if (walletRes.status >= 500) errors5xx.add(1);
    if (walletRes.status >= 400 && walletRes.status < 500) errors4xx.add(1);
    if (walletRes.status === 0) timeouts.add(1);
  }

  sleep(0.3);

  // ========================================
  // 3. GET LEADERBOARD
  // ========================================

  const leaderboardRes = http.post(
    `${baseUrl}/functions/v1/get-daily-leaderboard-by-country`,
    JSON.stringify({ country_code: 'HU' }),
    { headers: authHeaders, timeout: '10s', tags: { name: 'leaderboard' } }
  );

  leaderboardDuration.add(leaderboardRes.timings.duration);

  const leaderboardOk = check(leaderboardRes, {
    'leaderboard status 200': (r) => r.status === 200,
    'leaderboard has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.leaderboard);
      } catch (e) {
        return false;
      }
    },
  });

  leaderboardSuccess.add(leaderboardOk);

  if (!leaderboardOk) {
    if (leaderboardRes.status >= 500) errors5xx.add(1);
    if (leaderboardRes.status >= 400 && leaderboardRes.status < 500) errors4xx.add(1);
    if (leaderboardRes.status === 0) timeouts.add(1);
  }

  sleep(0.5);

  // ========================================
  // 4. START GAME SESSION
  // ========================================

  const gameStartRes = http.post(
    `${baseUrl}/functions/v1/start-game-session`,
    JSON.stringify({ category: 'mixed' }),
    { headers: authHeaders, timeout: '15s', tags: { name: 'game_start' } }
  );

  gameStartDuration.add(gameStartRes.timings.duration);

  const gameStartOk = check(gameStartRes, {
    'game start status 200': (r) => r.status === 200,
    'game has sessionId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.sessionId && body.questions;
      } catch (e) {
        return false;
      }
    },
  });

  gameStartSuccess.add(gameStartOk);

  if (!gameStartOk) {
    if (gameStartRes.status >= 500) errors5xx.add(1);
    if (gameStartRes.status >= 400 && gameStartRes.status < 500) errors4xx.add(1);
    if (gameStartRes.status === 0) timeouts.add(1);
    return; // Can't continue without session
  }

  const sessionId = JSON.parse(gameStartRes.body).sessionId;

  sleep(1); // Think time before answering

  // ========================================
  // 5. ANSWER 3 QUESTIONS
  // ========================================

  for (let i = 0; i < 3; i++) {
    const answerPayload = JSON.stringify({
      sessionId: sessionId,
      questionIndex: i,
      correctAnswers: Math.random() > 0.5 ? 1 : 0,
      totalQuestions: 15,
      coinsEarned: Math.floor(Math.random() * 5) + 1,
      completed: false,
    });

    const answerRes = http.post(
      `${baseUrl}/functions/v1/complete-game`,
      answerPayload,
      { headers: authHeaders, timeout: '10s', tags: { name: 'answer' } }
    );

    answerDuration.add(answerRes.timings.duration);

    const answerOk = check(answerRes, {
      'answer status 200': (r) => r.status === 200,
    });

    answerSuccess.add(answerOk);

    if (!answerOk) {
      if (answerRes.status >= 500) errors5xx.add(1);
      if (answerRes.status >= 400 && answerRes.status < 500) errors4xx.add(1);
      if (answerRes.status === 0) timeouts.add(1);
    }

    sleep(Math.random() * 1 + 0.5); // Random think time 0.5-1.5s
  }
}

// ========================================
// TEARDOWN
// ========================================

export function teardown(data) {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  DingleUP! Load Test Completed                             ║
╠════════════════════════════════════════════════════════════╣
║  Check the summary above for detailed metrics              ║
║  Report saved to: reports/                                 ║
╚════════════════════════════════════════════════════════════╝
  `);
}
