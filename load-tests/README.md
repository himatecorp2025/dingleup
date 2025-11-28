# DingleUP! Load Testing Suite

Átfogó terheléses teszt suite a DingleUP! backend infrastruktúrájához. CLI-ből futtatható, **nincs admin UI vagy vizuális dashboard**.

## 🎯 Célok

- 5,000-10,000 egyidejű felhasználó szimulálása
- Kritikus API végpontok terhelése
- Válaszidő, throughput és hibaarány mérése
- Szűk keresztmetszetek azonosítása
- Részletes Markdown riport generálása

## 📋 Előfeltételek

```bash
cd load-tests
npm install
```

## 🚀 Futtatás

### Összes teszt futtatása (ajánlott)

```bash
npm run test:all
```

Ez futtatja az összes scenariot szekvenciálisan és generál egy átfogó riportot.

### Egyedi tesztek futtatása

```bash
# Csak authentication flow
npm run test:auth

# Csak game flow (start → questions → complete)
npm run test:game

# Csak rewards flow (wallet, daily gifts)
npm run test:rewards

# Csak leaderboard
npm run test:leaderboard
```

## 📊 Tesztelt Endpointok

1. **Authentication Flow**
   - `login-with-username-pin` - PIN-alapú bejelentkezés

2. **Game Flow**
   - `start-game-session` - Játék indítás
   - `get-game-questions` - Kérdések betöltése
   - `complete-game` - Játék befejezés + jutalom jóváírás

3. **Rewards Flow**
   - `get-wallet` - Wallet lekérdezés (arany, életek, daily gift eligibility)

4. **Leaderboard**
   - `get-daily-leaderboard-by-country` - Napi ranglista országonként

## 📈 Mért Metrikák

- **Latency:** Átlag, P50, P95, P99, Max válaszidők (ms)
- **Throughput:** Requests/second
- **Error Rate:** 4xx, 5xx HTTP státuszkódok aránya
- **Timeouts:** Timeout események száma
- **Status Code Distribution:** Részletes bontás státuszkódokra

## 📄 Riport

A teszt futás végén automatikusan generálódik:

```
load-tests/LOAD_TEST_REPORT.md
```

A riport tartalmazza:
- Executive summary
- Scenariónkénti részletes eredmények
- Azonosított szűk keresztmetszetek
- Optimalizálási javaslatok
- Next steps

## ⚙️ Konfiguráció

Módosítsd a `.env` fájlt (vagy használd a környezeti változókat):

```env
VIRTUAL_USERS=5000        # Szimulált felhasználók száma
TEST_DURATION=60          # Teszt időtartam (másodperc)
CONNECTIONS=100           # Párhuzamos kapcsolatok
PIPELINING=10             # HTTP pipelining szint
```

## 🔍 Példa Kimenet

```
╔═══════════════════════════════════════════════════════════════╗
║           DingleUP! Comprehensive Load Test Suite             ║
╚═══════════════════════════════════════════════════════════════╝

Configuration:
- Virtual Users: 5000
- Test Duration: 60s per scenario
- Connections: 100
- Backend: Lovable Cloud (Supabase)

TEST 1: Authentication Flow
✅ Complete
- Avg Latency: 234ms
- P95: 450ms
- Error Rate: 0.2%

...

📄 Report saved to: load-tests/LOAD_TEST_REPORT.md
```

## 🚨 Fontos Megjegyzések

1. **NEM készült admin UI** - minden script-alapú CLI tool
2. **Nem módosítja az alkalmazás logikáját** - csak olvasási/teszt műveletek
3. **Elkülönített teszt környezet** - külön `load-tests/` mappa
4. **Idempotens tesztek** - többször futtatható károkozás nélkül

## 🛠️ Hibaelhárítás

### "Module not found" hiba
```bash
cd load-tests
npm install
```

### Timeout hibák
Növeld a `TEST_DURATION` értékét vagy csökkentsd a `CONNECTIONS` számát.

### Authentication hibák
Ellenőrizd a `SUPABASE_URL` és `SUPABASE_ANON_KEY` környezeti változókat.

## 📞 Támogatás

Ha problémába ütközöl, ellenőrizd:
1. `load-tests/LOAD_TEST_REPORT.md` riportot hibák részleteiért
2. Supabase Dashboard > Edge Functions > Logs
3. Backend CPU/Memory használat

---

**NEM hoztam létre admin UI-t vagy új vizuális felületet a load testhez, mindent scripttel és belső teszteléssel oldottam meg.**
