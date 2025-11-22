# 🚀 DingleUP! Comprehensive Load & Stress Testing Guide

## 🎯 Célkitűzés

**Elérendő kapacitás:** 10,000 egyidejű aktív felhasználó/perc, hibátlanul  
**Elfogadható válaszidők:**
- P95 < 2,000ms
- P99 < 3,000ms
- Hibaarány < 1%

---

## 📋 Előfeltételek

### 1. K6 Telepítése

**macOS:**
```bash
brew install k6
```

**Windows (PowerShell - Admin módban):**
```powershell
choco install k6
```

**Linux (Ubuntu/Debian):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 2. Környezeti Változók

Az aktuális konfigurációt használjuk (éles környezet):
```bash
export BASE_URL="https://wdpxmwsxhckazwxufttk.supabase.co"
export ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcHhtd3N4aGNrYXp3eHVmdHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDQ3ODUsImV4cCI6MjA3NjE4MDc4NX0.DeAS4ACvq-YVt2ytoOS3NVSg7xFSHVhvyjUEOti_NnA"
```

---

## 🧪 Tesztelési Folyamat

### Fázis 1: Smoke Test (Előzetes Ellenőrzés)

**Cél:** Ellenőrizni, hogy minden endpoint működik alapszinten

```bash
k6 run --vus 1 --duration 30s k6-comprehensive-load-test.js
```

**Elvárt eredmények:**
- ✅ 0% hibaarány
- ✅ Minden request < 2s
- ✅ Nincs critical error

---

### Fázis 2: Light Load Test (100-500 user)

**Cél:** Baseline teljesítmény mérése alacsony terhelésnél

```bash
k6 run --vus 100 --duration 5m k6-comprehensive-load-test.js
```

**Elvárt eredmények:**
- ✅ < 0.5% hibaarány
- ✅ P95 < 1000ms
- ✅ Stabil válaszidők

---

### Fázis 3: Medium Load Test (500-2500 user)

**Cél:** Valós napi használat szimulálása

```bash
k6 run --vus 500 --duration 10m k6-comprehensive-load-test.js
```

**Elvárt eredmények:**
- ✅ < 1% hibaarány
- ✅ P95 < 1500ms
- ✅ P99 < 2500ms

---

### Fázis 4: Heavy Load Test (2500-5000 user)

**Cél:** Csúcsidőszaki forgalom szimulálása

```bash
k6 run --vus 2500 --duration 15m k6-comprehensive-load-test.js
```

**Elvárt eredmények:**
- ✅ < 2% hibaarány
- ✅ P95 < 2000ms
- ✅ P99 < 3500ms
- ✅ Nincs connection timeout

---

### Fázis 5: Full Comprehensive Test (10,000 user target)

**Cél:** Célterhélés elérése minden flow-val párhuzamosan

```bash
k6 run k6-comprehensive-load-test.js
```

Ez a script automatikusan futtatja az alábbi scenario-kat párhuzamosan:

| Scenario | Max VUs | Flow |
|----------|---------|------|
| Registration + Age Gate | 1,000 | Új user regisztráció, életkor validáció |
| Login (Mixed) | 2,500 | PIN + Biometric login |
| Game Play (Heavy) | 5,000 | Kérdések, válaszok, jutalmak |
| Leaderboard Queries | 3,000 | TOP 100 country-specific |
| Rewards + Boosters | 1,500 | Napi jutalmak, booster vásárlás |
| Profile Operations | 1,000 | Profil betöltés, username update |
| Admin Interface | 50 | Admin dashboard, translations |

**Összesen:** ~14,000 VU kombinált terhelés (10,000+ egyidejű aktív)

**Elvárt eredmények:**
- ✅ < 1% hibaarány
- ✅ P95 < 2000ms
- ✅ P99 < 3000ms
- ✅ Auth success > 98%
- ✅ Game start success > 95%
- ✅ Leaderboard load > 97%

---

### Fázis 6: Stress Test (Breaking Point)

**Cél:** Megtalálni a rendszer maximális kapacitását

```bash
k6 run --vus 15000 --duration 10m k6-comprehensive-load-test.js
```

Fokozatosan növeld tovább (20,000 → 25,000 → 30,000), amíg:
- Hibaarány > 10%
- vagy P99 > 5000ms
- vagy teljes leállás

---

### Fázis 7: Soak Test (Tartós Terhelés)

**Cél:** Memória leak és stability problémák feltárása

```bash
k6 run --vus 5000 --duration 2h k6-comprehensive-load-test.js
```

**Elvárt eredmények:**
- ✅ Stabil teljesítmény 2 óra után
- ✅ Nincs memory leak
- ✅ Response time nem nő lineárisan

---

## 📊 Eredmények Értelmezése

### Generált Fájlok

1. **load-test-summary.html** - Részletes vizuális report
   - Nyisd meg böngészőben: `open load-test-summary.html` (macOS) vagy `start load-test-summary.html` (Windows)
   - Tartalmazza: összesített metrikák, threshold pass/fail, endpoint-specific teljesítmény, feature success rates

2. **load-test-summary.json** - Nyers metrika adatok
   - JSON formátum további elemzéshez
   - Importálható analytics tool-okba

3. **Konzol output** - Azonnali összegzés
   - Real-time feedback a teszt alatt
   - Gyors overview a fő metrikákról

### Mérési Metrikák Magyarázata

#### HTTP Általános Metrikák
- **http_req_duration**: Teljes request-response időtartam
  - **avg**: Átlagos válaszidő
  - **P95**: 95% a requesteknek ennél gyorsabb
  - **P99**: 99% a requesteknek ennél gyorsabb
  
- **http_req_failed**: Sikertelen HTTP requestek aránya
  - Target: < 1% (production-ready)
  - > 5% = kritikus probléma

#### Endpoint-Specifikus Metrikák
- **login_response_time**: Login (username+PIN) válaszidő
  - Target P95: < 1000ms
  
- **question_fetch_time**: Játékkérdések lekérdezési idő
  - Target P95: < 800ms
  
- **answer_submit_time**: Válasz küldés + validáció idő
  - Target P95: < 1000ms
  
- **leaderboard_response_time**: TOP 100 leaderboard query
  - Target P95: < 1500ms
  
- **daily_reward_response_time**: Napi jutalom jóváírás
  - Target P95: < 1000ms

#### Feature Success Rates
- **auth_success**: Sikeres authentikáció (login/register)
  - Target: > 98%
  
- **age_gate_success**: Életkor validáció és mentés
  - Target: > 98%
  
- **game_start_success**: Játék indítás sikeres
  - Target: > 95%
  
- **leaderboard_load_success**: Leaderboard betöltés
  - Target: > 97%
  
- **daily_reward_claim_success**: Napi jutalom sikeresen jóváírva
  - Target: > 98%

#### Game Statistics
- **total_games_played**: Játék sessionök száma
- **total_questions_answered**: Összes megválaszolt kérdés
- **total_coins_earned**: Összesen szerzett arany

---

## 🔍 Bottleneck Azonosítás

### 1. Adatbázis Lassulás Jelei

**Tünetek:**
- P95/P99 meredeken nő terhelésnövelésnél
- `question_fetch_time` > 1500ms
- `leaderboard_response_time` > 2500ms

**Ellenőrzés:**
```bash
# Supabase Dashboard > Database > Query Performance
# Nézd meg a leglassabb query-ket
```

**Valószínű okok:**
- Hiányzó indexek (questions, profiles, daily_rankings)
- N+1 query problémák
- Leaderboard runtime aggregálás nagy táblán

---

### 2. Edge Function CPU Limit

**Tünetek:**
- `auth_success` < 95%
- Timeout errorok
- Válaszidő sztochasztikus ugrásokkal

**Ellenőrzés:**
```bash
# Supabase Dashboard > Edge Functions > Logs
# Keress "timeout" vagy "out of memory" üzeneteket
```

**Valószínű okok:**
- Számítás-intenzív logika edge function-ökben
- Túl sok szekvenciális API hívás
- Nem optimalizált loop/algoritmus

---

### 3. Frontend Rendering Lag

**Tünetek:**
- Backend metrikák OK, de felhasználók lassulást érzékelnek
- UI fagyások, késleltetett kattintások

**Ellenőrzés:**
- Chrome DevTools > Performance tab
- React DevTools > Profiler

**Valószínű okok:**
- Felesleges re-renderek
- Nagy state objektumok
- Hiányzó memoization (React.memo, useMemo, useCallback)

---

### 4. Hálózati Latency

**Tünetek:**
- Minden endpoint egyformán lassú
- Geographic location függő válaszidők

**Ellenőrzés:**
```bash
# Measure network latency
ping wdpxmwsxhckazwxufttk.supabase.co
```

**Valószínű okok:**
- CDN nincs beállítva
- Supabase region távol a felhasználóktól

---

## ⚡ Optimalizálási Stratégiák

### Adatbázis Optimalizálások

#### 1. Indexek Létrehozása

```sql
-- Profiles gyors user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country_code);

-- Questions gyakori category query
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);

-- Daily Rankings leaderboard query
CREATE INDEX IF NOT EXISTS idx_daily_rankings_date_country 
ON daily_rankings(day_date, country_code, total_correct_answers DESC);

-- Game Results analytics
CREATE INDEX IF NOT EXISTS idx_game_results_user_created 
ON game_results(user_id, created_at DESC);
```

#### 2. Leaderboard Cache Tábla

```sql
-- Pre-computed TOP 100 cache (frissül minden játék után vagy 5 percenként)
CREATE TABLE leaderboard_cache (
  country_code TEXT NOT NULL,
  rank INT NOT NULL,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  total_correct_answers INT NOT NULL,
  avatar_url TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (country_code, rank)
);

CREATE INDEX idx_leaderboard_cache_country ON leaderboard_cache(country_code);
```

#### 3. Connection Pooling

```typescript
// Edge function-ökben használd a connection pooler-t
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  {
    db: {
      schema: 'public',
    },
    global: {
      headers: { 'X-Connection-Pooler': 'true' },
    },
  }
);
```

---

### Edge Function Optimalizálások

#### 1. Batch Operations

```typescript
// ❌ ROSSZ: Szekvenciális query-k
for (const user of users) {
  await supabase.from('profiles').select('*').eq('id', user.id);
}

// ✅ JÓ: Batch query
const userIds = users.map(u => u.id);
const { data } = await supabase
  .from('profiles')
  .select('*')
  .in('id', userIds);
```

#### 2. In-Memory Cache

```typescript
// Question cache (változatlan adat)
const questionCache = new Map<string, any[]>();

function getCachedQuestions(category: string) {
  if (questionCache.has(category)) {
    return questionCache.get(category);
  }
  
  // Load from DB
  const questions = await fetchQuestionsFromDB(category);
  questionCache.set(category, questions);
  
  return questions;
}
```

#### 3. Parallel Processing

```typescript
// ❌ ROSSZ: Szekvenciális
const profile = await getProfile(userId);
const gameResults = await getGameResults(userId);
const leaderboard = await getLeaderboard(countryCode);

// ✅ JÓ: Párhuzamos
const [profile, gameResults, leaderboard] = await Promise.all([
  getProfile(userId),
  getGameResults(userId),
  getLeaderboard(countryCode),
]);
```

---

### Frontend Optimalizálások

#### 1. React Query Caching

```typescript
// useQuery automatikus cache + stale-while-revalidate
const { data: leaderboard } = useQuery({
  queryKey: ['leaderboard', countryCode],
  queryFn: () => fetchLeaderboard(countryCode),
  staleTime: 30000, // 30 seconds
  cacheTime: 300000, // 5 minutes
});
```

#### 2. Code Splitting

```typescript
// Lazy load non-critical pages
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
```

#### 3. Memoization

```typescript
// Expensive component re-render megelőzése
const LeaderboardRow = React.memo(({ user, rank }) => {
  return (
    <div className="leaderboard-row">
      <span>{rank}</span>
      <span>{user.username}</span>
      <span>{user.score}</span>
    </div>
  );
});
```

---

## 🎯 Sikerkritériumok

### ✅ Production-Ready (10,000 user/perc)

- P95 response time < 2,000ms minden critical endpoint-ra
- P99 response time < 3,000ms
- Hibaarány < 1%
- Auth success > 98%
- Game start success > 95%
- Leaderboard load > 97%
- Nincs memory leak 2 órás soak test alatt
- Rendszer helyreáll spike után 30 másodpercen belül

### ⚠️ Requires Optimization (5,000-10,000 user)

- P95 < 3,000ms, de > 2,000ms
- Hibaarány 1-3%
- Egyes feature success rates 90-95% között

### ❌ Critical Issues (< 5,000 user)

- P95 > 3,000ms
- Hibaarány > 5%
- Timeout errors > 2%
- Connection exhaustion
- Memory leak detektálva

---

## 📈 Monitoring Eszközök

### Real-Time Monitoring Teszt Alatt

```bash
# Terminal #1: K6 test futtatása
k6 run k6-comprehensive-load-test.js

# Terminal #2: Supabase logs követése
# Nyisd meg: https://supabase.com/dashboard/project/wdpxmwsxhckazwxufttk
# Navigálj: Edge Functions > Logs (real-time)

# Terminal #3: Database stats
# Nyisd meg: Supabase Dashboard > Database > Query Performance
```

### K6 Cloud (Opcionális - Részletesebb Analytics)

```bash
# Regisztrálj: https://app.k6.io
# Login
k6 login cloud

# Futtatás cloud monitoring-gal
k6 cloud k6-comprehensive-load-test.js
```

---

## 📝 Eredmény Dokumentálás

### Minden Teszt Után Rögzítsd:

1. **Test konfiguráció**
   - Dátum/idő
   - Max VUs (virtual users)
   - Teszt időtartam
   - Scenarios (melyek futottak)

2. **Mért metrikák**
   - Átlag/P95/P99 response time
   - Hibaarány %
   - Sikeres request/sec
   - Feature success rates

3. **Azonosított problémák**
   - Bottleneck típus (DB / edge function / frontend / network)
   - Hiba üzenetek (példák)
   - Threshold failures

4. **Alkalmazott optimalizálások**
   - Mi változott a kódban/konfigban
   - Index/cache/connection pool beállítások
   - Kódrészletek (előtte/utána)

5. **Újra-teszt eredmények**
   - Mennyit javult a teljesítmény
   - Új max kapacitás
   - Maradó problémák

---

## 🚨 Gyakori Hibák és Megoldások

### Probléma: "Connection timeout" > 5%

**Oka:**
- Database connection pool kimerült
- Edge function timeout (10s default)

**Megoldás:**
```sql
-- Növeld a connection limit-et Supabase-ben
ALTER DATABASE postgres SET max_connections = 100;

-- Vagy használj connection pooler-t edge function-ökben
```

---

### Probléma: Leaderboard query > 3000ms

**Oka:**
- Runtime aggregálás nagy táblán (daily_rankings)
- Hiányzó composite index

**Megoldás:**
```sql
-- Composite index country + date + score
CREATE INDEX idx_daily_rankings_leaderboard 
ON daily_rankings(country_code, day_date, total_correct_answers DESC);

-- Vagy használj pre-computed cache táblát
```

---

### Probléma: Question fetch > 1500ms

**Oka:**
- 8 nyelvi fordítás JOIN (question_translations)
- Nincs limit/offset optimalizálás

**Megoldás:**
```typescript
// Cache-eld a gyakori kérdéseket
const questionsCache = new Map();

// Vagy használj denormalizált táblát (questions + translations egy helyen)
```

---

### Probléma: "Out of memory" edge function error

**Oka:**
- Nagy adatstruktúra memory-ban
- Loop-ban object accumulation

**Megoldás:**
```typescript
// ❌ ROSSZ
let allResults = [];
for (const batch of batches) {
  allResults = [...allResults, ...batch]; // Memory grows
}

// ✅ JÓ
for (const batch of batches) {
  await processBatch(batch); // Process and discard
}
```

---

## 🎓 Best Practices

### 1. Fokozatos Terhelésnövelés
❌ NE indíts azonnal 10,000 VU-val  
✅ Kezd 100 → 500 → 1,000 → 2,500 → 5,000 → 10,000

### 2. Baseline Mindig Legyen
✅ Első teszt ELŐTT rögzítsd a baseline-t (100 VU, 5 perc)  
✅ Minden optimalizálás után ÚJRA mérj ugyanazzal a teszt config-gal

### 3. Változtass Egyszerre Egyet
❌ NE optimalizálj DB + edge function + frontend egyszerre  
✅ Egy réteg → teszt → dokumentálás → következő réteg

### 4. Production-Szerű Környezet
✅ Ugyanaz a Supabase tier  
✅ Ugyanaz az edge function config  
✅ Hasonló adatmennyiség (ne üres DB)

---

## 📞 Troubleshooting

### Ha a teszt fail-el azonnal (< 1 min)

1. Ellenőrizd az API kulcsokat (.env)
2. Nézd meg a Supabase Dashboard > Edge Functions > Logs
3. Futtasd le smoke test-et debug módban:
```bash
k6 run --vus 1 --duration 30s --log-output=stdout k6-comprehensive-load-test.js
```

### Ha válaszidők túl magasak (> 5s)

1. Identify a leglassabb endpoint-ot a HTML report-ból
2. Supabase Dashboard > Database > Query Performance
3. Nézd meg, melyik query tart > 1s
4. Adj hozzá indexet vagy optimalizálj

### Ha hibaarány > 10%

1. Nézd meg a hibaüzeneteket (console + JSON report)
2. Azonosítsd a hibakódokat (500 / 429 / 503)
3. Supabase logs: Edge Functions > Filter by status code

---

## 🎯 Elérendő Milestone-ok

| Milestone | VUs | Target P95 | Target Error Rate | Status |
|-----------|-----|------------|-------------------|--------|
| Baseline | 100 | < 500ms | < 0.1% | ⬜ TODO |
| Light Load | 500 | < 1000ms | < 0.5% | ⬜ TODO |
| Medium Load | 2,500 | < 1500ms | < 1% | ⬜ TODO |
| Heavy Load | 5,000 | < 2000ms | < 1% | ⬜ TODO |
| **Target (Production)** | **10,000** | **< 2000ms** | **< 1%** | ⬜ TODO |
| Stress (Breaking Point) | 15,000+ | N/A | > 10% | ⬜ TODO |

---

## 📊 Report Template

Minden teszt futtatás után töltsd ki:

```markdown
## Load Test Report - [DÁTUM]

### Konfiguráció
- **Max VUs:** 10,000
- **Duration:** 20 minutes
- **Scenarios:** All 7 flows
- **Environment:** Production (wdpxmwsxhckazwxufttk.supabase.co)

### Mért Eredmények
- **Total Requests:** 1,245,892
- **Failed Requests:** 0.45% (5,606 / 1,245,892)
- **Avg Response Time:** 842ms
- **P95 Response Time:** 1,654ms ✅ (target: < 2000ms)
- **P99 Response Time:** 2,891ms ✅ (target: < 3000ms)

### Endpoint Performance
| Endpoint | P95 (ms) | Success Rate | Status |
|----------|----------|--------------|--------|
| Login | 765 | 99.2% | ✅ PASS |
| Question Fetch | 1,123 | 97.8% | ✅ PASS |
| Leaderboard | 1,890 | 98.1% | ✅ PASS |
| Daily Reward | 654 | 99.5% | ✅ PASS |

### Bottleneck-ek
1. **Leaderboard query lassú** (P95 = 1890ms)
   - Oka: Hiányzó composite index (country_code + day_date)
   - Megoldás: Index létrehozva

2. **Question fetch ingadozik** (876ms → 2100ms spike)
   - Oka: 8 nyelvi fordítás JOIN
   - Megoldás: Cache implementálás

### Optimalizálások
1. ✅ Composite index: daily_rankings(country_code, day_date, total_correct_answers DESC)
2. ✅ Question cache: 15 perc TTL
3. ⬜ TODO: Leaderboard pre-computed cache tábla

### Következő Lépések
- Újra-teszt index optimalizálások után
- Leaderboard cache implementálás
- Soak test 2 órán keresztül
```

---

## 🏁 Összefoglalás

**Cél:** 10,000 user/perc, < 1% error, P95 < 2s  
**Módszer:** Fokozatos terhelésnövelés 7 scenario-val párhuzamosan  
**Eszköz:** K6 comprehensive load test script  
**Output:** HTML + JSON report + konzol summary  
**Next Steps:** Bottleneck azonosítás → optimalizálás → újra-teszt → dokumentálás

---

**Utolsó frissítés:** 2025-01-22  
**Verzió:** 2.0 Comprehensive  
**Szerző:** DingleUP! DevOps & Performance Team
