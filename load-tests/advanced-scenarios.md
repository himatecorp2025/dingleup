# Haladó Terheléses Teszt Forgatókönyvek

## Scenario A: Gyors login + játék (Standard flow)

### User journey

1. **Login** - `login-with-username-pin`
2. **Wallet fetch** - `get-wallet`
3. **Leaderboard check** - `get-daily-leaderboard-by-country`
4. **Game start** - `start-game-session`
5. **Answer 5-10 questions** - `complete-game` (loop)

### K6 implementáció

```javascript
// Login
const loginRes = http.post(`${baseUrl}/functions/v1/login-with-username-pin`, ...);
const authToken = JSON.parse(loginRes.body).session.access_token;

// Wallet
http.post(`${baseUrl}/functions/v1/get-wallet`, ..., { headers: authHeaders });

// Leaderboard
http.post(`${baseUrl}/functions/v1/get-daily-leaderboard-by-country`, ...);

// Game
const gameRes = http.post(`${baseUrl}/functions/v1/start-game-session`, ...);
const sessionId = JSON.parse(gameRes.body).sessionId;

// Answer loop
for (let i = 0; i < 10; i++) {
  http.post(`${baseUrl}/functions/v1/complete-game`, {
    sessionId,
    questionIndex: i,
    correctAnswers: Math.random() > 0.3 ? 1 : 0,
    ...
  });
  sleep(1); // Think time
}
```

### Metrikák

- Login success rate: > 99%
- Game start success rate: > 99%
- Answer success rate: > 98%
- p95 latency: < 500ms

---

## Scenario B: Popup/kiesés → folytatás

### User journey

1. **Login**
2. **Check wallet (lives)**
3. **Start game**
4. **Give wrong answers** → életvesztés
5. **Trigger kiesés popup**
6. **Load boosters** (rescue popup)
7. **Purchase booster** (30% chance)
8. **Repeat** until lives = 0

### K6 implementáció

```javascript
// Check initial lives
const walletRes = http.post(`${baseUrl}/functions/v1/get-wallet`, ...);
let lives = JSON.parse(walletRes.body).lives;

// Play until lives run out
while (lives > 0) {
  // Start game
  const gameRes = http.post(`${baseUrl}/functions/v1/start-game-session`, ...);
  const sessionId = JSON.parse(gameRes.body).sessionId;

  // Give intentionally wrong answers
  for (let i = 0; i < 5; i++) {
    http.post(`${baseUrl}/functions/v1/complete-game`, {
      sessionId,
      questionIndex: i,
      correctAnswers: 0, // Always wrong
      ...
    });
  }

  lives--;

  // Trigger rescue popup check
  if (lives === 0) {
    // Load available boosters
    http.get(`${baseUrl}/rest/v1/booster_types?is_active=eq.true`, ...);
    
    // 30% chance to purchase
    if (Math.random() < 0.3) {
      http.post(`${baseUrl}/functions/v1/purchase-booster`, {
        booster_type_id: 'free_booster',
        purchase_source: 'gold',
      });
    }
  }
}
```

### Metrikák

- Popup load success: > 99%
- Booster purchase success: > 95%
- Lives deduction correctness: 100%

---

## Scenario C: Napi jutalom + ranglista fókusz

### User journey

1. **Login**
2. **Daily gift check** (can claim?)
3. **Claim gift** (if available)
4. **Fetch daily leaderboard**
5. **Refresh leaderboard cache**
6. **Fetch game profile**
7. **Sleep 60-120s**
8. **Repeat** (simulates users refreshing leaderboard)

### K6 implementáció

```javascript
// Login
const loginRes = http.post(`${baseUrl}/functions/v1/login-with-username-pin`, ...);
const authToken = JSON.parse(loginRes.body).session.access_token;

// Check wallet for gift eligibility
const walletRes = http.post(`${baseUrl}/functions/v1/get-wallet`, ...);

// Daily leaderboard
http.post(`${baseUrl}/functions/v1/get-daily-leaderboard-by-country`, {
  country_code: 'HU'
});

// Refresh cache (might fail if not admin)
http.post(`${baseUrl}/functions/v1/refresh-leaderboard-cache`, ...);

// Game profile
http.post(`${baseUrl}/functions/v1/get-user-game-profile`, ...);

sleep(randomInt(60, 120)); // Wait 1-2 minutes
```

### Metrikák

- Leaderboard load: < 200ms (with cache)
- Cache refresh: < 500ms
- Gift claim success: > 99%

---

## Vegyes forgatókönyvek terhelési teszt során

A `game-load-test.js` **randomizálja** a szcenáriókat:

- 50% - Scenario A (standard gameplay)
- 30% - Scenario C (rewards/leaderboard)
- 20% - Scenario B (popup/rescue)

Ez realisztikusabb felhasználói viselkedést szimulál.

---

## Custom scenario írása

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export function myCustomScenario(baseUrl, anonKey, authToken) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
    'Authorization': `Bearer ${authToken}`,
  };

  // 1. Your custom API calls here
  const res = http.post(`${baseUrl}/functions/v1/your-endpoint`, ...);

  // 2. Validation
  check(res, {
    'custom check': (r) => r.status === 200,
  });

  // 3. Think time
  sleep(1);

  return true;
}
```

---

## Real-world tips

### Tip 1: Fokozatos skálázás mindig

**❌ NE EZT CSINÁLD:**
```bash
k6 run -e TARGET_VUS=25000 ...  # Egyből maximum
```

**✅ CSINÁLD EZT:**
```bash
k6 run -e TARGET_VUS=500 ...    # Kis teszt
# → Sikeres? →
k6 run -e TARGET_VUS=5000 ...   # Közepes teszt
# → Sikeres? →
k6 run -e TARGET_VUS=25000 ...  # Maximum teszt
```

### Tip 2: Monitor the database

Terhelés közben ellenőrizd:
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

### Tip 3: Edge function logs

```bash
# Real-time logs terhelés közben
supabase functions logs --project-ref wdpxmwsxhckazwxufttk
```

---

## Automatizálás (CI/CD)

### GitHub Actions példa

```yaml
name: Load Test

on:
  schedule:
    - cron: '0 2 * * *'  # Minden nap 2:00-kor

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install K6
        run: |
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run load test
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          cd load-tests
          k6 run -e TARGET_VUS=5000 game-load-test.js
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: load-tests/reports/
```

---

## Következő lépések production előtt

1. ✅ Futtasd mind a 3 szint tesztet sikeresen
2. ✅ Implementáld az azonosított optimalizálásokat
3. ✅ Ismételd meg a teszteket az optimalizálások után
4. ✅ Dokumentáld a végső kapacitást és bottleneckeket
5. ✅ Állíts be monitoring alerteket production-ben
