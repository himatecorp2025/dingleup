# K6 Load Testing - Gyors Parancsok

## Telepítés

```bash
# macOS
brew install k6

# Linux (Ubuntu/Debian)
curl -fsSL https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows
choco install k6
```

## Setup

```bash
# 1. Másold az env fájlt
cp .env.example .env

# 2. Szerkeszd meg a BASE_URL és SUPABASE_ANON_KEY értékeket
nano .env

# 3. Hozd létre a teszt usereket
node scripts/create-test-users.js
```

## Teszt futtatás

### Kezdő teszt (500 user) - AJÁNLOTT ELSŐ

```bash
k6 run -e TARGET_VUS=500 -e RAMP_UP_DURATION=60s -e HOLD_DURATION=120s game-load-test.js
```

Vagy NPM script:
```bash
npm run test:small
```

### Közepes teszt (5,000 user)

```bash
k6 run -e TARGET_VUS=5000 -e RAMP_UP_DURATION=180s -e HOLD_DURATION=300s game-load-test.js
```

Vagy NPM script:
```bash
npm run test:medium
```

### Maximum teszt (25,000 user)

```bash
k6 run -e TARGET_VUS=25000 -e RAMP_UP_DURATION=300s -e HOLD_DURATION=180s game-load-test.js
```

Vagy NPM script:
```bash
npm run test:large
```

### Interaktív wizard

```bash
./run-tests.sh
```

## Kimenet mentése

### JSON export

```bash
k6 run game-load-test.js --out json=reports/result-$(date +%Y%m%d-%H%M%S).json
```

### CSV export

```bash
k6 run game-load-test.js --out csv=reports/result.csv
```

### InfluxDB export (advanced)

```bash
k6 run game-load-test.js --out influxdb=http://localhost:8086/k6
```

## Debugging

### Részletes HTTP logok

```bash
k6 run --http-debug game-load-test.js
```

### Csak egy iteráció (dry-run)

```bash
k6 run -i 1 -u 1 game-load-test.js
```

### Summary JSON

```bash
k6 run --summary-export=summary.json game-load-test.js
```

## Metrikák lekérdezése futás közben

```bash
# Másik terminálban, miközben a teszt fut
watch -n 1 'curl http://localhost:6565/v1/metrics'
```

## Teszt felhasználók management

### Újra létrehozás (ha törölted őket)

```bash
node scripts/create-test-users.js
```

### Ellenőrzés (hány létezik?)

```bash
curl -X POST "$BASE_URL/rest/v1/profiles?select=username&username=ilike.loadtest_user_%&limit=100" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  | jq '. | length'
```

### Törlés (ha újra akarod kezdeni)

```sql
DELETE FROM profiles WHERE username LIKE 'loadtest_user_%';
```

## Eredmények gyors ellenőrzése

### Success rate

```bash
k6 run game-load-test.js | grep "✓"
```

### Error rate

```bash
k6 run game-load-test.js | grep "✗"
```

### P95/P99 válaszidők

```bash
k6 run game-load-test.js | grep "http_req_duration"
```

## Gyors fix: Gyakori hibák

### "No test users"
```bash
node scripts/create-test-users.js
```

### "Connection refused"
```bash
# Teszteld a connection-t
curl "$BASE_URL/functions/v1/get-wallet"
```

### "Rate limited"
```bash
# Várj 15 percet vagy használj több usert
```

### "Out of memory"
```bash
# Csökkentsd a VU számot
k6 run -e TARGET_VUS=100 game-load-test.js
```

## Teljesítmény összehasonlítás

### Előtte vs Utána

```bash
# Baseline teszt (optimalizálás előtt)
k6 run -e TARGET_VUS=1000 game-load-test.js > baseline.txt

# Implementáld az optimalizálásokat...

# Utána teszt
k6 run -e TARGET_VUS=1000 game-load-test.js > optimized.txt

# Diff
diff baseline.txt optimized.txt
```

## Cloud deployment

### k6 Cloud

```bash
# Login
k6 login cloud --token YOUR_TOKEN

# Run in cloud
k6 cloud game-load-test.js \
  -e TARGET_VUS=25000 \
  -e BASE_URL=$BASE_URL \
  -e SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

## Automata napi teszt (cron)

```bash
# Adj hozzá a crontab-hoz
0 2 * * * cd /path/to/load-tests && k6 run -e TARGET_VUS=5000 game-load-test.js >> logs/daily-test.log 2>&1
```
