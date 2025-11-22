# DingleUP! Load Testing Infrastructure

Professzionális terheléses tesztelési rendszer K6 használatával, 25,000 egyidejű felhasználó kezelésének tesztelésére.

## 🎯 Célkitűzés

Mérjük meg, hogy az alkalmazás képes-e kezelni **legalább 25,000 egyidejű felhasználót** egy percen belül:
- ✅ Hibák, bugok, 500-as válaszok nélkül
- ✅ Játékindítások, kérdésválaszok, popupok működnek
- ✅ Napi jutalmak, ranglisták frissülnek
- ✅ p95 < 500ms válaszidő

## 📋 Előfeltételek

### K6 telepítése

**macOS:**
```bash
brew install k6
```

**Linux (Debian/Ubuntu):**
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

### Környezeti változók

Hozz létre egy `.env` fájlt a `load-tests/` mappában:

```env
BASE_URL=https://wdpxmwsxhckazwxufttk.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

## 🚀 Futtatási útmutató

### 1. Kezdő teszt (500 felhasználó)

**Biztonságos próba** - ajánlott első futtatás:

```bash
k6 run \
  -e BASE_URL=$BASE_URL \
  -e SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -e TARGET_VUS=500 \
  -e RAMP_UP_DURATION=60s \
  -e HOLD_DURATION=120s \
  game-load-test.js
```

**Eredmény:** Ha minden zöld, továbbléphetünk.

### 2. Közepes teszt (5,000 felhasználó)

```bash
k6 run \
  -e BASE_URL=$BASE_URL \
  -e SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -e TARGET_VUS=5000 \
  -e RAMP_UP_DURATION=180s \
  -e HOLD_DURATION=300s \
  game-load-test.js
```

### 3. Maximum teszt (25,000 felhasználó)

**⚠️ FIGYELEM:** Csak akkor futtasd, ha az 5,000-es teszt sikeres volt!

```bash
k6 run \
  -e BASE_URL=$BASE_URL \
  -e SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -e TARGET_VUS=25000 \
  -e RAMP_UP_DURATION=300s \
  -e HOLD_DURATION=180s \
  game-load-test.js
```

### Kimenet mentése HTML reportba

```bash
k6 run game-load-test.js --out json=results.json
k6-to-html results.json --output reports/report-$(date +%Y%m%d-%H%M%S).html
```

## 📊 Metrikák magyarázata

### Válaszidők

- **p50 (median):** A kérések 50%-a ennél gyorsabb
- **p95:** A kérések 95%-a ennél gyorsabb (🎯 cél: <500ms)
- **p99:** A kérések 99%-a ennél gyorsabb

### HTTP státuszok

- **2xx:** Sikeres kérések ✅
- **4xx:** Kliens hibák (rossz request)
- **5xx:** Szerver hibák ❌ (0.5% alatt kell lennie)

### Hibaráta

```
error_rate = (failed_requests / total_requests) * 100
```

🎯 **Sikerkritérium:** error_rate < 1%

## 🧪 Tesztforgatókönyvek

### Scenario A: Gyors login + játék

1. Login username + PIN
2. Új játék indítása
3. 5-10 kérdés megválaszolása
4. Napi jutalom lekérése
5. Ranglista megtekintése

### Scenario B: Popup/kiesés szimuláció

1. Login
2. Játék start
3. Rossz válaszok → életvesztés
4. Kiesés popup
5. Folytatás logika tesztelése

### Scenario C: Jutalom + ranglista fókusz

1. Login
2. Napi jutalom claim
3. Daily leaderboard
4. Weekly leaderboard
5. Ismétlés 1-2 percenként

## 📁 Fájlok szerkezete

```
load-tests/
├── README.md                    # Ez a dokumentáció
├── ENDPOINTS.md                 # API végpontok dokumentációja
├── game-load-test.js            # Fő terheléses teszt script
├── scenarios/
│   ├── scenario-a-gameplay.js   # Játék forgatókönyv
│   ├── scenario-b-popup.js      # Popup tesztelés
│   └── scenario-c-rewards.js    # Jutalom + ranglista
├── test-data/
│   └── users.json               # Teszt felhasználók
└── reports/                     # Generált riportok
    └── .gitkeep
```

## ✅ Sikerkritériumok

| Metrika | Cél | Kritikus küszöb |
|---------|-----|-----------------|
| p95 válaszidő | <500ms | <1000ms |
| p99 válaszidő | <1000ms | <2000ms |
| HTTP 5xx rate | <0.5% | <1% |
| Timeout rate | <0.1% | <0.5% |
| RPS (requests/sec) | >1000 | >500 |

## 🐛 Hibaelhárítás

### "Connection refused" hiba

```bash
# Ellenőrizd a BASE_URL-t
echo $BASE_URL

# Teszteld curl-lel
curl $BASE_URL/functions/v1/get-wallet
```

### "401 Unauthorized"

```bash
# Ellenőrizd a SUPABASE_ANON_KEY-t
echo $SUPABASE_ANON_KEY
```

### "Too many connections" DB hiba

- Csökkentsd a TARGET_VUS értéket
- Növeld a CONNECTION_POOL_SIZE-t a Supabase dashboardon

## 📈 Eredmények dokumentálása

Minden teszt után:

1. Készíts screenshot-ot a K6 summary-ról
2. Mentsd a JSON outputot: `results-YYYYMMDD-HHMMSS.json`
3. Jegyzd fel:
   - Max VU (virtual users)
   - p95/p99 latency
   - Error rate
   - Szűk keresztmetszetek

4. Ha hibát találsz:
   - Jegyezd le melyik endpoint okozta
   - Milyen hibaüzenet volt
   - Hány felhasználónál jelentkezett

## 🎓 Tovább olvasnivaló

- [K6 dokumentáció](https://k6.io/docs/)
- [K6 példák](https://k6.io/docs/examples/)
- [Supabase teljesítmény útmutató](https://supabase.com/docs/guides/platform/performance)
