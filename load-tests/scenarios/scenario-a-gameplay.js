/**
 * SCENARIO A: Gyors login + játék
 * 
 * User journey:
 * 1. Login username + PIN
 * 2. Start új játék
 * 3. 5-10 kérdés megválaszolása
 * 4. Napi jutalom lekérése
 * 5. Ranglista megtekintése
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export function scenarioA(baseUrl, anonKey, authToken) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
    'Authorization': `Bearer ${authToken}`,
  };

  // Start game session
  const gameRes = http.post(
    `${baseUrl}/functions/v1/start-game-session`,
    JSON.stringify({ category: 'mixed' }),
    { headers, timeout: '15s' }
  );

  const gameOk = check(gameRes, {
    'game start 200': (r) => r.status === 200,
    'has sessionId': (r) => {
      try {
        return JSON.parse(r.body).sessionId;
      } catch (e) {
        return false;
      }
    },
  });

  if (!gameOk) return false;

  const sessionId = JSON.parse(gameRes.body).sessionId;
  const questionsToAnswer = Math.floor(Math.random() * 6) + 5; // 5-10 questions

  sleep(1);

  // Answer questions
  for (let i = 0; i < questionsToAnswer; i++) {
    const answerRes = http.post(
      `${baseUrl}/functions/v1/complete-game`,
      JSON.stringify({
        sessionId,
        questionIndex: i,
        correctAnswers: Math.random() > 0.3 ? 1 : 0, // 70% correct rate
        totalQuestions: 15,
        coinsEarned: Math.floor(Math.random() * 5) + 1,
        completed: false,
      }),
      { headers, timeout: '10s' }
    );

    check(answerRes, {
      'answer submitted': (r) => r.status === 200,
    });

    sleep(Math.random() * 1 + 0.5); // Think time 0.5-1.5s
  }

  // Get wallet (dashboard data)
  const walletRes = http.post(
    `${baseUrl}/functions/v1/get-wallet`,
    JSON.stringify({}),
    { headers, timeout: '10s' }
  );

  check(walletRes, {
    'wallet fetched': (r) => r.status === 200,
  });

  sleep(0.3);

  // Get leaderboard
  const leaderboardRes = http.post(
    `${baseUrl}/functions/v1/get-daily-leaderboard-by-country`,
    JSON.stringify({ country_code: 'HU' }),
    { headers, timeout: '10s' }
  );

  check(leaderboardRes, {
    'leaderboard fetched': (r) => r.status === 200,
  });

  return true;
}
