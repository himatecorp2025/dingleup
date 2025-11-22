/**
 * SCENARIO B: Popup / kiesés → folytatás szimuláció
 * 
 * User journey:
 * 1. Login
 * 2. Start game
 * 3. Szándékosan rossz válaszok → életvesztés
 * 4. Kiesés popup trigger
 * 5. Folytatás / visszalépés logika
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export function scenarioB(baseUrl, anonKey, authToken) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
    'Authorization': `Bearer ${authToken}`,
  };

  // Get wallet to check lives
  const walletRes = http.post(
    `${baseUrl}/functions/v1/get-wallet`,
    JSON.stringify({}),
    { headers, timeout: '10s' }
  );

  if (walletRes.status !== 200) return false;

  const wallet = JSON.parse(walletRes.body);
  let currentLives = wallet.lives;

  // Start multiple games until we run out of lives
  for (let attempt = 0; attempt < 3 && currentLives > 0; attempt++) {
    sleep(0.5);

    const gameRes = http.post(
      `${baseUrl}/functions/v1/start-game-session`,
      JSON.stringify({ category: 'mixed' }),
      { headers, timeout: '15s' }
    );

    const gameOk = check(gameRes, {
      'game start ok': (r) => r.status === 200,
    });

    if (!gameOk) break;

    const sessionId = JSON.parse(gameRes.body).sessionId;

    // Give intentionally wrong answers (30% correct rate)
    for (let i = 0; i < 5; i++) {
      const answerRes = http.post(
        `${baseUrl}/functions/v1/complete-game`,
        JSON.stringify({
          sessionId,
          questionIndex: i,
          correctAnswers: Math.random() > 0.7 ? 1 : 0, // Only 30% correct
          totalQuestions: 15,
          coinsEarned: 0,
          completed: false,
        }),
        { headers, timeout: '10s' }
      );

      check(answerRes, {
        'answer processed': (r) => r.status === 200,
      });

      sleep(0.5);
    }

    currentLives--;

    // Check if popup should trigger (out of lives)
    if (currentLives <= 0) {
      // Simulate checking booster purchase endpoint
      const boosterCheckRes = http.get(
        `${baseUrl}/rest/v1/booster_types?select=*&is_active=eq.true`,
        { headers, timeout: '5s' }
      );

      check(boosterCheckRes, {
        'boosters loaded for rescue popup': (r) => r.status === 200,
      });

      sleep(1); // User reviews popup

      // Simulate booster purchase (optional)
      if (Math.random() > 0.7) {
        // 30% actually purchase
        const boosterRes = http.post(
          `${baseUrl}/functions/v1/purchase-booster`,
          JSON.stringify({
            booster_type_id: 'free_booster_id',
            purchase_source: 'gold',
          }),
          { headers, timeout: '10s' }
        );

        check(boosterRes, {
          'booster purchase attempted': (r) => r.status === 200 || r.status === 400,
        });
      }

      break; // Exit attempt loop
    }
  }

  return true;
}
