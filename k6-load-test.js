import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const failRate = new Rate('failed_requests');
const responseTrend = new Trend('response_time');
const authSuccessRate = new Rate('auth_success');
const chatLoadRate = new Rate('chat_load_success');
const gameStartRate = new Rate('game_start_success');
const messageCount = new Counter('messages_sent');

// Load test configuration
export const options = {
  scenarios: {
    // Scenario 1: Registration spike
    registration: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },   // Ramp up to 100 users
        { duration: '3m', target: 100 },   // Stay at 100
        { duration: '1m', target: 0 },     // Ramp down
      ],
      exec: 'registrationFlow',
      startTime: '0s',
    },
    
    // Scenario 2: Sustained dashboard load
    dashboard: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },   // Ramp up to 500 users
        { duration: '5m', target: 500 },   // Stay at 500
        { duration: '2m', target: 1000 },  // Ramp to 1000
        { duration: '5m', target: 1000 },  // Stay at 1000
        { duration: '2m', target: 0 },     // Ramp down
      ],
      exec: 'dashboardFlow',
      startTime: '1m',
    },
    
    // Scenario 3: Chat stress test
    chat: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 200 },   // Ramp up
        { duration: '5m', target: 500 },   // Medium load
        { duration: '3m', target: 1000 },  // Peak load
        { duration: '2m', target: 0 },     // Ramp down
      ],
      exec: 'chatFlow',
      startTime: '2m',
    },
    
    // Scenario 4: Game sessions
    game: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 0 },
      ],
      exec: 'gameFlow',
      startTime: '3m',
    },
    
    // Scenario 5: Shop/Payment flow
    shop: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      exec: 'shopFlow',
      startTime: '4m',
    },
  },
  
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    'http_req_failed': ['rate<0.05'],                   // Error rate < 5%
    'failed_requests': ['rate<0.05'],
    'auth_success': ['rate>0.95'],
    'chat_load_success': ['rate>0.90'],
    'game_start_success': ['rate>0.95'],
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://wdpxmwsxhckazwxufttk.supabase.co';
const ANON_KEY = __ENV.ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
};

// Helper: Register new user
function registerUser() {
  const email = `loadtest-${Date.now()}-${Math.random()}@test.com`;
  const password = 'TestPassword123!';
  const username = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const payload = JSON.stringify({
    email,
    password,
    options: {
      data: {
        username
      }
    }
  });
  
  const res = http.post(`${BASE_URL}/auth/v1/signup`, payload, { headers });
  
  const success = check(res, {
    'registration successful': (r) => r.status === 200,
  });
  
  authSuccessRate.add(success);
  failRate.add(!success);
  responseTrend.add(res.timings.duration);
  
  if (success && res.json('access_token')) {
    return {
      token: res.json('access_token'),
      userId: res.json('user.id'),
      email,
    };
  }
  
  return null;
}

// Helper: Login user
function loginUser(email, password) {
  const payload = JSON.stringify({ email, password });
  const res = http.post(`${BASE_URL}/auth/v1/token?grant_type=password`, payload, { headers });
  
  const success = check(res, {
    'login successful': (r) => r.status === 200,
  });
  
  authSuccessRate.add(success);
  responseTrend.add(res.timings.duration);
  
  if (success) {
    return res.json('access_token');
  }
  
  return null;
}

// Scenario 1: Registration Flow
export function registrationFlow() {
  const user = registerUser();
  
  if (user) {
    console.log(`✓ User registered: ${user.email}`);
  }
  
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Scenario 2: Dashboard Flow
export function dashboardFlow() {
  const user = registerUser();
  if (!user) return;
  
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${user.token}`,
  };
  
  // Load dashboard data
  const dashboardRes = http.get(`${BASE_URL}/rest/v1/profiles?id=eq.${user.userId}`, { headers: authHeaders });
  
  check(dashboardRes, {
    'dashboard loaded': (r) => r.status === 200,
  });
  
  responseTrend.add(dashboardRes.timings.duration);
  
  // Load game results
  const resultsRes = http.get(`${BASE_URL}/rest/v1/game_results?user_id=eq.${user.userId}&limit=10`, { headers: authHeaders });
  
  check(resultsRes, {
    'game results loaded': (r) => r.status === 200,
  });
  
  sleep(Math.random() * 2 + 1);
}

// Scenario 3: Chat Flow
export function chatFlow() {
  const user = registerUser();
  if (!user) return;
  
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${user.token}`,
  };
  
  // Load threads
  const threadsRes = http.post(
    `${BASE_URL}/functions/v1/get-threads`,
    null,
    { headers: authHeaders }
  );
  
  const success = check(threadsRes, {
    'threads loaded': (r) => r.status === 200,
  });
  
  chatLoadRate.add(success);
  responseTrend.add(threadsRes.timings.duration);
  
  // Send a message (simulate)
  const threads = threadsRes.json('threads');
  if (threads && threads.length > 0) {
    const randomThread = threads[Math.floor(Math.random() * threads.length)];
    
    const messagePayload = JSON.stringify({
      recipientId: randomThread.other_user_id,
      body: `Load test message at ${Date.now()}`
    });
    
    const sendRes = http.post(
      `${BASE_URL}/functions/v1/send-dm`,
      messagePayload,
      { headers: authHeaders }
    );
    
    if (check(sendRes, { 'message sent': (r) => r.status === 200 })) {
      messageCount.add(1);
    }
  }
  
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

// Scenario 4: Game Flow
export function gameFlow() {
  const user = registerUser();
  if (!user) return;
  
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${user.token}`,
  };
  
  // Start game session
  const categories = ['culture', 'finance', 'health', 'history', 'general'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  const gamePayload = JSON.stringify({ category });
  
  const gameRes = http.post(
    `${BASE_URL}/functions/v1/start-game-session`,
    gamePayload,
    { headers: authHeaders }
  );
  
  const success = check(gameRes, {
    'game started': (r) => r.status === 200,
  });
  
  gameStartRate.add(success);
  responseTrend.add(gameRes.timings.duration);
  
  if (success) {
    const sessionId = gameRes.json('sessionId');
    
    // Simulate answering 5 questions
    for (let i = 0; i < 5; i++) {
      sleep(Math.random() * 3 + 2); // 2-5 seconds per question
      
      const answerPayload = JSON.stringify({
        sessionId,
        questionIndex: i,
        selectedAnswer: Math.floor(Math.random() * 4),
        responseTime: Math.random() * 10000 + 1000
      });
      
      const answerRes = http.post(
        `${BASE_URL}/functions/v1/validate-answer`,
        answerPayload,
        { headers: authHeaders }
      );
      
      check(answerRes, {
        'answer validated': (r) => r.status === 200,
      });
    }
  }
  
  sleep(Math.random() * 2 + 1);
}

// Scenario 5: Shop Flow
export function shopFlow() {
  const user = registerUser();
  if (!user) return;
  
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${user.token}`,
  };
  
  // Get wallet balance
  const walletRes = http.post(
    `${BASE_URL}/functions/v1/get-wallet`,
    null,
    { headers: authHeaders }
  );
  
  check(walletRes, {
    'wallet loaded': (r) => r.status === 200,
  });
  
  responseTrend.add(walletRes.timings.duration);
  
  // Browse shop items (simulate by loading profile multiple times)
  for (let i = 0; i < 3; i++) {
    const shopRes = http.get(`${BASE_URL}/rest/v1/profiles?id=eq.${user.userId}`, { headers: authHeaders });
    sleep(Math.random() * 2 + 1);
  }
  
  sleep(Math.random() * 3 + 2);
}

// Summary handler
export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>DingleUp Load Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #D4AF37; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #D4AF37; color: white; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
    .metric { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎮 DingleUp Load Test Results</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    
    <h2>📊 Overall Metrics</h2>
    <div class="metric">
      <strong>Total Requests:</strong> ${data.metrics.http_reqs.values.count}<br>
      <strong>Failed Requests:</strong> ${data.metrics.http_req_failed.values.passes} (${((data.metrics.http_req_failed.values.passes / data.metrics.http_reqs.values.count) * 100).toFixed(2)}%)<br>
      <strong>Avg Response Time:</strong> ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms<br>
      <strong>P95 Response Time:</strong> ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms<br>
      <strong>P99 Response Time:</strong> ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
    </div>
    
    <h2>✅ Threshold Results</h2>
    <table>
      <tr><th>Threshold</th><th>Status</th></tr>
      ${Object.entries(data.metrics)
        .filter(([_, metric]) => metric.thresholds)
        .map(([name, metric]) => 
          Object.entries(metric.thresholds).map(([threshold, result]) => 
            `<tr>
              <td>${name}: ${threshold}</td>
              <td class="${result.ok ? 'pass' : 'fail'}">${result.ok ? '✓ PASS' : '✗ FAIL'}</td>
            </tr>`
          ).join('')
        ).join('')}
    </table>
    
    <h2>📈 Scenario Breakdown</h2>
    <div class="metric">
      <strong>Auth Success Rate:</strong> ${(data.metrics.auth_success.values.rate * 100).toFixed(2)}%<br>
      <strong>Chat Load Success:</strong> ${(data.metrics.chat_load_success.values.rate * 100).toFixed(2)}%<br>
      <strong>Game Start Success:</strong> ${(data.metrics.game_start_success.values.rate * 100).toFixed(2)}%<br>
      <strong>Messages Sent:</strong> ${data.metrics.messages_sent.values.count}
    </div>
  </div>
</body>
</html>
  `;
}

function textSummary(data, config) {
  let output = '\n' + '='.repeat(60) + '\n';
  output += '  📊 DINGLEUP LOAD TEST SUMMARY\n';
  output += '='.repeat(60) + '\n\n';
  
  output += 'Overall Metrics:\n';
  output += `  Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  output += `  Failed: ${data.metrics.http_req_failed.values.passes} (${((data.metrics.http_req_failed.values.passes / data.metrics.http_reqs.values.count) * 100).toFixed(2)}%)\n`;
  output += `  Avg Response: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  output += `  P95 Response: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  
  return output;
}
