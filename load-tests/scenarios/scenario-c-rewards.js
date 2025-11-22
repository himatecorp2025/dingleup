/**
 * SCENARIO C: Napi jutalom + ranglista fókusz
 * 
 * User journey:
 * 1. Login
 * 2. Napi jutalom claim
 * 3. Daily leaderboard
 * 4. Ismétlés 1-2 percenként
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export function scenarioC(baseUrl, anonKey, authToken) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
    'Authorization': `Bearer ${authToken}`,
  };

  // Get wallet first
  const walletRes = http.post(
    `${baseUrl}/functions/v1/get-wallet`,
    JSON.stringify({}),
    { headers, timeout: '10s' }
  );

  check(walletRes, {
    'wallet loaded': (r) => r.status === 200,
  });

  sleep(0.5);

  // Fetch daily leaderboard
  const dailyLeaderRes = http.post(
    `${baseUrl}/functions/v1/get-daily-leaderboard-by-country`,
    JSON.stringify({ country_code: 'HU' }),
    { headers, timeout: '10s' }
  );

  check(dailyLeaderRes, {
    'daily leaderboard loaded': (r) => r.status === 200,
    'has leaderboard data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.leaderboard);
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);

  // Refresh leaderboard cache (admin-level operation, might fail)
  const refreshRes = http.post(
    `${baseUrl}/functions/v1/refresh-leaderboard-cache`,
    JSON.stringify({}),
    { headers, timeout: '15s' }
  );

  check(refreshRes, {
    'cache refresh attempted': (r) => r.status === 200 || r.status === 403,
  });

  sleep(0.5);

  // Fetch game profile
  const profileRes = http.post(
    `${baseUrl}/functions/v1/get-user-game-profile`,
    JSON.stringify({}),
    { headers, timeout: '10s' }
  );

  check(profileRes, {
    'game profile loaded': (r) => r.status === 200,
  });

  return true;
}
