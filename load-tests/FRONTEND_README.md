# DingleUP! Frontend Performance & Load Testing

Frontend-specifikus terheléses teszt suite a DingleUP! React alkalmazáshoz. Valódi böngésző szimulációval, Core Web Vitals méréssel és Lighthouse auditokkal.

## 🎯 Célok

- **25,000 concurrent user** szimulálása (konfiguráció szerint)
- **Core Web Vitals** mérése (LCP, FID, CLS, FCP)
- **Lighthouse Performance Audit** minden kulcsfontosságú oldalon
- **User Journey Testing** teljes felhasználói folyamatok szimulálása
- **Page Load Performance** részletes breakdown
- Részletes Markdown riport generálása

## 📋 Előfeltételek

```bash
cd load-tests
npm install --save playwright lighthouse chrome-launcher
```

## 🚀 Futtatás

### Teljes frontend teszt suite (ajánlott)

```bash
npm run test:frontend
```

Ez futtatja:
1. Lighthouse auditokat (Landing, Game, Leaderboard)
2. User Journey tesztet (teljes navigációs folyamat)
3. 25,000 concurrent user szimulációt

### Egyedi frontend tesztek

```bash
# Csak Lighthouse audits
npm run test:lighthouse

# Csak user journey
npm run test:user-journey

# Csak concurrent users
npm run test:concurrent-users
```

## 📊 Mért Metrikák

### Core Web Vitals (Google Standard)
- **LCP (Largest Contentful Paint):** < 2.5s (Good)
- **FID (First Input Delay):** < 100ms (Good)
- **CLS (Cumulative Layout Shift):** < 0.1 (Good)
- **FCP (First Contentful Paint):** < 1.8s (Good)

### Lighthouse Scores (0-100)
- Performance
- Accessibility
- Best Practices
- SEO
- PWA

### Load Testing Metrics
- Page load times (átlag, P95)
- Success rate under load
- Resource loading statistics
- Bundle sizes and counts

## 📄 Riport

A teszt futás végén automatikusan generálódik:

```
load-tests/FRONTEND_LOAD_TEST_REPORT.md
```

A riport tartalmazza:
- Core Web Vitals elemzés
- Lighthouse audit eredmények minden oldalra
- User Journey performance breakdown
- Concurrent users teszt eredmények
- Frontend optimalizálási javaslatok

## ⚙️ Konfiguráció

Módosítsd a `frontend-config.js` fájlt:

```javascript
module.exports = {
  appUrl: 'https://your-app-url.com',
  concurrentUsers: 25000,        // Szimulált felhasználók
  rampUpTime: 300,               // Ramp-up idő (sec)
  testDuration: 600,             // Teszt időtartam (sec)
  headless: true,                // Headless browser
  browserType: 'chromium',       // chromium, firefox, webkit
  
  thresholds: {
    pageLoadTime: 3000,          // 3 sec
    firstContentfulPaint: 1800,  // 1.8 sec
    largestContentfulPaint: 2500,// 2.5 sec
    cumulativeLayoutShift: 0.1,  // Google threshold
  }
};
```

## 🔍 Példa Kimenet

```
╔═══════════════════════════════════════════════════════════════╗
║       DingleUP! Frontend Performance & Load Test Suite        ║
╚═══════════════════════════════════════════════════════════════╝

TEST 1: Lighthouse Performance Audits
✅ Landing Page: Performance 92/100 🟢
✅ Game Page: Performance 88/100 🟢
✅ Leaderboard: Performance 85/100 🟢

TEST 2: User Journey
✅ Landing → Game → Leaderboard
- Total Journey Time: 2,456ms
- LCP: 1,834ms
- CLS: 0.08

TEST 3: 25,000 Concurrent Users
Progress: 100% | Success: 24,847 | Failed: 153
Success Rate: 99.39%
Average Load Time: 2,123ms

📄 Report saved to: FRONTEND_LOAD_TEST_REPORT.md
```

## 🎭 Mit Tesztel?

### 1. Lighthouse Audits
- Landing page performance
- Game page performance
- Leaderboard performance
- Accessibility, Best Practices, SEO, PWA scores

### 2. User Journey Test
- Landing page betöltés
- Navigáció a játékhoz
- Játék oldal betöltés
- Leaderboard betöltés
- Teljes user flow időmérése

### 3. Concurrent Users Load Test
- 25,000 virtuális user szimulálása
- Batch processing (100 user/batch)
- Valós böngésző sessions
- Page load times minden userhez
- Success/failure rate tracking

## 🚨 Fontos Megjegyzések

1. **Valós böngésző használat** - Playwright headless Chrome/Firefox/WebKit
2. **CPU/Memory intenzív** - 25,000 user tesztelése több percet vesz igénybe
3. **Hálózati forgalom** - Valós HTTP requestek mennek az alkalmazáshoz
4. **NEM módosít semmit** - Csak olvasási műveletek

## 🛠️ Hibaelhárítás

### "Browser not found" hiba
```bash
npx playwright install chromium
```

### Out of memory
Csökkentsd a `concurrentUsers` értékét vagy a batch size-ot a `concurrent-users.js` fájlban.

### Timeout hibák
Növeld a timeout értékeket a `frontend-config.js` fájlban vagy javítsd az alkalmazás teljesítményét.

### Lighthouse hibák
Győződj meg róla, hogy a Chrome telepítve van és elérhető.

## 📈 Benchmark Célok (25,000 Users)

- **Success Rate:** > 99%
- **Avg Page Load:** < 3 seconds
- **P95 Load Time:** < 5 seconds
- **LCP:** < 2.5 seconds
- **CLS:** < 0.1
- **Lighthouse Performance:** > 85/100

---

**NEM hoztam létre admin UI-t vagy új vizuális felületet a frontend load testhez, mindent scripttel és Playwright automatizálással oldottam meg.**
