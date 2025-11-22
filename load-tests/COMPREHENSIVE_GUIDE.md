# DingleUP! Átfogó Load Testing Útmutató

## 📋 Tartalomjegyzék

1. [Gyors áttekintés](#gyors-áttekintés)
2. [Teljes telepítés](#teljes-telepítés)
3. [Teszt felhasználók létrehozása](#teszt-felhasználók-létrehozása)
4. [Futtatási forgatókönyvek](#futtatási-forgatókönyvek)
5. [Eredmények értelmezése](#eredmények-értelmezése)
6. [Bottleneck azonosítás](#bottleneck-azonosítás)
7. [Optimalizálási javaslatok](#optimalizálási-javaslatok)

---

## Gyors áttekintés

A DingleUP! load testing rendszer **három fő komponensből** áll:

1. **K6 szkriptek** - Terhelésgenerálás
2. **Teszt adatok** - Pre-seeded felhasználók
3. **Dokumentáció** - Ez az útmutató

**Cél:** Mérjük, hogy az app képes-e **25,000 egyidejű felhasználót** kezelni hibák nélkül.

---

## Teljes telepítés

### 1. K6 telepítése

**macOS (Homebrew):**
```bash
brew install k6
```

**Ubuntu/Debian:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows (Chocolatey):**
```bash
choco install k6
```

**Docker:**
```bash
docker pull grafana/k6:latest
```

### 2. Projekt setup

```bash
cd load-tests/
npm install  # Telepíti a node-fetch-et a user creation scripthez
```

### 3. Környezeti változók

Másold át `.env.example` → `.env`:

```bash
cp .env.example .env
```

Szerkeszd a `.env` fájlt:
```env
BASE_URL=https://wdpxmwsxhckazwxufttk.supabase.co
SUPABASE_ANON_KEY=eyJ...  # Anon API key
```

---

## Teszt felhasználók létrehozása

**⚠️ FONTOS:** Ezt csak egyszer kell futtatni!

```bash
cd load-tests/
export $(cat .env | grep -v '#' | xargs)
node scripts/create-test-users.js
```

**Mit csinál ez a script?**

- Létrehoz 100 teszt felhasználót: `loadtest_user_000` - `loadtest_user_099`
- Mindegyiknek PIN kódja: `123456`
- Ha már létezik egy user, kihagyja
- Batch-ekben dolgozik (10 user/batch) hogy ne ömöljön el a rendszer

**Output:**
```
✅ Created: loadtest_user_000
✅ Created: loadtest_user_001
⏭️  Skipped: loadtest_user_002 (already exists)
...
╔════════════════════════════════════════════════════════════╗
║  Summary                                                   ║
╠════════════════════════════════════════════════════════════╣
║  Total:      100                                          ║
║  Successful: 100                                          ║
║  Skipped:    0                                            ║
║  Failed:     0                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## Futtatási forgatókönyvek

### Szint 1: Kezdő teszt (500 user) 🟢

**Ajánlott első futtatás** - biztonságos próba.

```bash
cd load-tests/
k6 run \
  -e BASE_URL="$BASE_URL" \
  -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -e TARGET_VUS=500 \
  -e RAMP_UP_DURATION=60s \
  -e HOLD_DURATION=120s \
  game-load-test.js
```

**NPM script:**
```bash
npm run test:small
```

**Mit tesztel:**
- 500 virtuális felhasználó
- 60s ramp-up (0 → 500 user)
- 120s hold (500 user stabil terhelés)
- Minden user: login, wallet, leaderboard, game start, 3 answer

**Várható eredmény:**
- ✅ 100% success rate
- ✅ p95 < 500ms
- ✅ 0% error rate

---

### Szint 2: Közepes teszt (5,000 user) 🟡

**Csak akkor futtasd, ha Szint 1 sikeres volt!**

```bash
k6 run \
  -e BASE_URL="$BASE_URL" \
  -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -e TARGET_VUS=5000 \
  -e RAMP_UP_DURATION=180s \
  -e HOLD_DURATION=300s \
  game-load-test.js
```

**NPM script:**
```bash
npm run test:medium
```

**Mit tesztel:**
- 5,000 virtuális felhasználó
- 180s ramp-up (3 perc)
- 300s hold (5 perc stabil terhelés)

**Várható kihívások:**
- Connection pool telítődés
- Database query lassulás
- Edge function cold starts

---

### Szint 3: Maximum teszt (25,000 user) 🔴

**⚠️ CSAK akkor futtasd, ha Szint 2 sikeres volt!**

```bash
k6 run \
  -e BASE_URL="$BASE_URL" \
  -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -e TARGET_VUS=25000 \
  -e RAMP_UP_DURATION=300s \
  -e HOLD_DURATION=180s \
  game-load-test.js
```

**NPM script:**
```bash
npm run test:large
```

**Mit tesztel:**
- 25,000 virtuális felhasználó (CÉL)
- 300s ramp-up (5 perc)
- 180s hold (3 perc maximum terhelés)

**Kritikus:** Ha ez sikeres, az app production-ready!

---

### Interaktív teszt futtatás

```bash
./run-tests.sh
```

Ez egy CLI wizard ami végigvezet a folyamaton:
1. Terhelési szint választás (1-4)
2. Paraméterek megadása
3. Automatikus futtatás
4. Report generálás

---

## Eredmények értelmezése

### K6 summary példa

```
✓ http_req_duration..............: avg=324ms    min=89ms   med=298ms   max=2.1s   p(95)=456ms p(99)=789ms
✓ http_req_failed................: 0.12%   ✓ 12      ✗ 9988
✓ http_reqs......................: 10000   333.33/s
✓ iteration_duration.............: avg=5.2s     min=4.1s   med=5.1s    max=8.3s
✓ iterations.....................: 1000    33.33/iter/s
✓ login_success_rate.............: 99.80%  ✓ 998     ✗ 2
✓ game_start_success_rate........: 99.50%  ✓ 995     ✗ 5
✓ answer_success_rate............: 98.90%  ✓ 2967    ✗ 33
```

### Mit jelentenek a metrikák?

| Metrika | Leírás | Cél | Kritikus |
|---------|--------|-----|----------|
| **http_req_duration (p95)** | 95% kérések ennél gyorsabbak | <500ms | <1000ms |
| **http_req_duration (p99)** | 99% kérések ennél gyorsabbak | <1000ms | <2000ms |
| **http_req_failed** | Sikertelen HTTP kérések aránya | <1% | <2% |
| **login_success_rate** | Sikeres loginok aránya | >99% | >95% |
| **game_start_success_rate** | Sikeres játékindítások | >99% | >95% |
| **errors_5xx** | 5xx hibák száma | <50 | <100 |

### Sikeres teszt kritériumai

✅ **PASSED** ha:
- p95 < 500ms
- error rate < 1%
- login success > 99%
- game start success > 99%

❌ **FAILED** ha:
- p95 > 1000ms
- error rate > 2%
- bármilyen endpoint > 5% error rate

---

## Bottleneck azonosítás

### Gyakori szűk keresztmetszetek

#### 1. Database Connection Pool telítődés

**Tünet:**
```
❌ connection refused
❌ too many connections
```

**Megoldás:**
1. Supabase Dashboard → Settings → Database
2. Connection Pooling → Enable
3. Pool Size → 100
4. Max Connections → 100

---

#### 2. Lassú query-k

**Tünet:**
```
✗ http_req_duration (p95)......: 3200ms
✗ get-daily-leaderboard-by-country: avg=3100ms
```

**Megoldás:**
1. Add indexeket:
```sql
CREATE INDEX idx_daily_rankings_user_country 
  ON daily_rankings(user_id, day_date);

CREATE INDEX idx_profiles_country 
  ON profiles(country_code);
```

2. Leaderboard cache használata:
```sql
-- Refresh cache minden 5 percben
SELECT refresh_leaderboard_cache_optimized();
```

---

#### 3. Edge Function timeout

**Tünet:**
```
❌ timeout exceeded (30s)
✗ timeouts: 142
```

**Megoldás:**
- Optimalizáld a függvény logikát
- Használj párhuzamos query-ket
- Cache-elj gyakori adatokat
- Csökkentsd a query komplexitást

---

#### 4. Rate limiting

**Tünet:**
```
❌ 429 Too Many Requests
✗ login-with-username-pin: 35% error rate
```

**Megoldás:**
- Növeld a rate limit thresholdokat
- Implementálj exponenciális backoff-ot
- Használj több teszt felhasználót

---

## Optimalizálási javaslatok

### Priority 1: Kritikus (azonnal implementáld)

1. **Connection Pooling**
   - Supabase Dashboard beállítás
   - Immediate impact: -70% connection errors

2. **Leaderboard Cache**
   - Materialized view vagy cache tábla
   - Immediate impact: 3500ms → 150ms

3. **Question Random Selection**
   - `TABLESAMPLE` használata nagy táblákon
   - Immediate impact: 1800ms → 250ms

### Priority 2: Magas (ha nem éri el a 25k-t)

4. **Database Indexek**
   - Composite indexek user_id + timestamp mezőkre
   - Impact: -30% query time

5. **Edge Function Parallel Queries**
   - Párhuzamos `Promise.all()` használata
   - Impact: -40% total latency

6. **React Query Cache**
   - Frontend caching 30s TTL-lel
   - Impact: -50% unnecessary API calls

### Priority 3: Közepes (polish)

7. **CDN Cache**
   - Static assets CDN-re
   - Impact: -20% asset load time

8. **Image Optimization**
   - WebP formátum, lazy loading
   - Impact: -30% bandwidth

---

## Részletes teszt workflow

### Előkészítés

```bash
# 1. Navigálj a mappába
cd load-tests/

# 2. Ellenőrizd az env változókat
cat .env

# 3. Hozd létre a teszt felhasználókat (csak egyszer!)
node scripts/create-test-users.js
```

### Teszt futtatás

```bash
# 4. Futtass egy kis tesztet
npm run test:small

# 5. Várj 2-3 percet az eredményekre

# 6. Ha sikeres, lépj a következő szintre
npm run test:medium
```

### Eredmények mentése

```bash
# HTML report generálás (opcionális)
k6 run game-load-test.js --out json=results.json
k6-to-html results.json --output reports/report.html
```

---

## Debugging

### "No test users found" hiba

```bash
# Ellenőrizd hogy létrejöttek-e a userek
curl -X POST "$BASE_URL/functions/v1/login-with-username-pin" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{"username":"loadtest_user_000","pin":"123456"}'
```

### "Connection refused" hiba

```bash
# Teszteld a kapcsolatot
curl "$BASE_URL/health"
```

### "Rate limit exceeded" hiba

- Várj 15 percet a rate limit reset előtt
- Vagy növeld a teszt felhasználók számát (100 → 200)

---

## Advanced: Cloud Load Testing

Ha helyi gépről nem megy (túl sok VU), használj cloud service-t:

### k6 Cloud

```bash
k6 login cloud
k6 cloud run game-load-test.js
```

### Grafana Cloud

```bash
# Set token
export K6_CLOUD_TOKEN=your_token_here

# Run test in cloud
k6 cloud game-load-test.js
```

---

## Checklist: Production-ready

- [ ] 500 user teszt: p95 < 500ms, 0% error ✅
- [ ] 5,000 user teszt: p95 < 500ms, <1% error ✅
- [ ] 25,000 user teszt: p95 < 1000ms, <1% error ✅
- [ ] Nincs 500-as hiba ✅
- [ ] Nincs timeout ✅
- [ ] Nincs DB connection error ✅
- [ ] Leaderboard cache frissül ✅
- [ ] Game session validation működik ✅
- [ ] Popup logika stabil ✅
- [ ] Reward distribution helyes ✅

Ha minden ✅, az app **PRODUCTION-READY** 25,000 egyidejű userre!

---

## Kapcsolat és támogatás

Ha problémába ütközöl:
1. Ellenőrizd ezt az útmutatót
2. Nézd meg az ENDPOINTS.md-t
3. Futtass debug teszteket kisebb VU-val
4. Vizsgáld meg az edge function logokat a Supabase dashboardon
