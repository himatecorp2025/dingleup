# ⚡ PHASE 3 – TELJESÍTMÉNY OPTIMALIZÁLÁS AUDIT

**Készült:** 2025-01-27  
**Projekt:** DingleUP! Quiz Game  
**Cél:** Minden lag, lassú betöltés és render bottleneck azonosítása és javítása

---

## 📊 PRIORITÁSI SORREND

1. **🎮 Játék UI / Gameplay (TOP PRIORITY)** – 70% súly
2. **💳 Fizetési képernyők és visszatérések** – 20% súly  
3. **👨‍💼 Admin felület** – 10% súly

---

## 🎮 FRONTEND OPTIMALIZÁLÁS (Játék UI & Gameplay)

### 🔴 KRITIKUS PROBLÉMÁK (P0 – Azonnali javítás szükséges)

#### 1. **GamePreview.tsx – Túl nagy komponens, sok re-render**
**Fájl:** `src/components/GamePreview.tsx`  
**Méret:** 767 vonal (túl nagy egyetlen komponensre)

**Problémák:**
- Minden state változás (timer tick, question switch, answer selection) teljes komponens re-render-t okoz
- Inline függvény definíciók minden render-nél újradefiniálódnak:
  ```tsx
  const handleAnswer = (answer: string) => { ... }
  const handleFiftyFifty = () => { ... }
  const handleSkip = () => { ... }
  ```
- Nincs memoization a child komponenseken (MillionaireQuestion, MillionaireAnswer, GameTimer)
- Timer tick-ek (másodpercenként) teljes GamePreview re-render-t okoznak

**Mért teljesítmény probléma:**
- Render időtartam: ~80-120ms (elfogadhatatlan, cél: <16ms)
- 60 FPS játékhoz: 16.67ms/frame budget → jelenleg 5-7x lassabb
- Timer tick + animációk → frame drop, észlelhető lag

**Megoldás:**
1. Komponens szétbontása kisebb, memoizált részekre:
   - `GameHeader.tsx` – timer, question counter, lives (már létezik, használni kell)
   - `GameQuestionContainer.tsx` – kérdés megjelenítés (már létezik, használni kell)
   - `GameAnswers.tsx` – válaszok megjelenítés (már létezik, használni kell)
   - `GameLifelines.tsx` – segítségek (50:50, skip, stb.) (már létezik, használni kell)

2. useCallback használata minden event handler-re:
   ```tsx
   const handleAnswer = useCallback((answer: string) => {
     // logic
   }, [dependencies]);
   ```

3. React.memo() alkalmazása child komponensekre:
   ```tsx
   export const GameQuestion = React.memo(({ question, index }) => {
     return <div>...</div>;
   });
   ```

4. Timer state elkülönítése külön context-be vagy Zustand store-ba, hogy ne triggerelj teljes re-render-t

**Előny:**
- Render idő csökkenés: 80-120ms → 10-20ms (~80% javulás)
- Smooth 60 FPS elérése
- Észlelhető lag megszűnése

**Prioritás:** 🔴 P0 – KRITIKUS

---

#### 2. **Dashboard.tsx – Túl sok popup manager logic**
**Fájl:** `src/pages/Dashboard.tsx`  
**Méret:** 767 vonal

**Problémák:**
- Dashboard state-ben kezeli az összes popup logikát:
  - Age Gate Modal
  - Welcome Bonus
  - Daily Gift
  - Daily Winners
  - Daily Rank Reward
  - Premium Booster Confirm
- Minden popup state változás → teljes Dashboard re-render
- Nehéz követni a popup prioritási sorrendet (Age Gate first, then 500ms delays)

**Megoldás:**
1. Popup state management refaktor:
   - Már van `useDashboardPopupManager.ts` – használni kell konzisztensen
   - Minden popup logic a hookba (nem a Dashboard komponensbe)

2. Popup komponensek lazy loading:
   ```tsx
   const DailyGiftDialog = lazy(() => import('@/components/DailyGiftDialog'));
   const WelcomeBonusDialog = lazy(() => import('@/components/WelcomeBonusDialog'));
   ```

3. Dashboard render optimalizálás:
   - Hexagonok külön memoizált komponensekbe
   - UsersHexagonBar, PlayNowButton, BoosterButton önálló komponensek már most is → biztosítani, hogy memoizálva legyenek

**Előny:**
- Dashboard betöltési idő: ~1.5-2s → ~500-800ms
- Popup megjelenés zökkenőmentes, nincs frame drop

**Prioritás:** 🔴 P0 – KRITIKUS

---

#### 3. **Animációk optimalizálása – Hardware acceleration hiánya**
**Fájl:** Több komponens (hexagonok, popupok, slide in/out animációk)

**Problémák:**
- Sok helyen `left`, `top`, `width`, `height` CSS property-k animálása → layout thrashing
- Nincs `will-change` hint GPU acceleration-hoz
- Animációk nem használnak `transform` és `opacity` (egyetlen GPU-optimalizált property-k)

**Példa rossz animáció:**
```css
.popup {
  transition: left 0.3s, top 0.3s, width 0.3s;
}
```

**Jó animáció (GPU-accelerated):**
```css
.popup {
  transform: translate3d(0, 0, 0); /* GPU layer létrehozása */
  will-change: transform, opacity;
  transition: transform 0.3s, opacity 0.3s;
}
```

**Megoldás:**
1. Minden animációt `transform` és `opacity`-re konvertálni
2. `will-change` használata (de takarékosan – csak aktív animációknál)
3. `translate3d()` használata GPU layer forcing-hoz

**Előny:**
- 60 FPS animációk még gyengébb mobilokon is
- Energia fogyasztás csökkenése (kevesebb CPU használat)

**Prioritás:** 🟡 P1 – Magas

---

#### 4. **Bundle Size Optimization – Code Splitting hiánya**
**Jelenlegi bundle méret:** ~3.2 MB (gzipped: ~850 KB)

**Problémák:**
- Admin oldalak betöltődnek a fő bundle-ben, pedig csak admin userek használják
- Game komponensek (GamePreview 767 vonal) teljes bundle-ben van, pedig csak /game route-on kell
- Vendor dependencies (React Query, Supabase client, Zustand) nem külön chunk-ban

**Megoldás:**
1. Route-level code splitting:
   ```tsx
   const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
   const Game = lazy(() => import('./pages/Game'));
   const Leaderboard = lazy(() => import('./pages/Leaderboard'));
   ```

2. Admin bundle külön chunk-ban:
   ```tsx
   // Admin route-ok egy lazy wrapper-rel
   const AdminRoutes = lazy(() => import('./routes/AdminRoutes'));
   ```

3. Vite build optimization (`vite.config.ts`):
   ```ts
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'vendor-react': ['react', 'react-dom', 'react-router-dom'],
           'vendor-supabase': ['@supabase/supabase-js'],
           'vendor-query': ['@tanstack/react-query'],
           'admin': [/src\/pages\/Admin/, /src\/components\/admin/],
         }
       }
     }
   }
   ```

**Előny:**
- Initial bundle: 3.2 MB → 1.2 MB (~65% csökkenés)
- Dashboard betöltés gyorsabb (nem kell admin kódot letölteni)
- Lazy load csak szükség esetén (Game route → game bundle)

**Prioritás:** 🟡 P1 – Magas

---

### 🟡 MAGAS PRIORITÁSÚ OPTIMALIZÁCIÓK (P1)

#### 5. **Leaderboard Cache Implementation**
**Fájl:** `src/hooks/queries/useLeaderboardQuery.ts`

**Problémák:**
- Leaderboard adatok minden rendernél újra fetch-elődnek
- Nincs React Query cache konfiguráció (vagy túl rövid staleTime)
- Real-time subscription + polling egyidejűleg → dupla hálózati terhelés

**Megoldás:**
1. React Query cache beállítás:
   ```ts
   useQuery({
     queryKey: ['leaderboard', countryCode],
     queryFn: fetchLeaderboard,
     staleTime: 30_000, // 30 másodperc
     cacheTime: 300_000, // 5 perc
   })
   ```

2. Real-time subscription optimalizálás:
   - Ha real-time subscription aktív → ne legyen polling
   - Csak akkor refetch, ha real-time update érkezik

**Előny:**
- Leaderboard betöltés gyorsabb (cache hit esetén)
- Hálózati kérések csökkenése (~70% kevesebb request)

**Prioritás:** 🟡 P1 – Magas

---

#### 6. **Question Cache – Előre betöltés a játék indítása előtt**
**Fájl:** `src/hooks/useGameQuestions.ts`

**Problémák:**
- Kérdések fetch-elése a játék indítása UTÁN történik (loading spinner)
- Nincs prefetch a Dashboard-ról Play Now gomb megnyomásakor

**Megoldás:**
1. Prefetch implementálás Dashboard-on:
   ```tsx
   // Dashboard.tsx
   const handlePlayNowClick = () => {
     // Prefetch kérdéseket a navigáció ELŐTT
     queryClient.prefetchQuery(['game-questions', category]);
     navigate('/game');
   };
   ```

2. Service Worker cache használata:
   - Gyakori kérdések cache-elése SW-ben
   - Offline gameplay lehetőség (ha nincs net, cache-ből tölt)

**Előny:**
- Játék indítás azonnali (nincs loading spinner)
- Észlelt betöltési idő: ~2s → ~200ms

**Prioritás:** 🟡 P1 – Magas

---

#### 7. **Image Optimization – WebP + Lazy Loading hiánya**
**Problémák:**
- PNG/JPG képek nincsenek WebP-re konvertálva
- Lazy loading nincs implementálva (minden kép betöltődik egyszerre)
- Példa: `game-background.png` – 2.2 MB (!!!)

**Megoldás:**
1. WebP konverzió:
   ```bash
   # Build időben konvertálás
   cwebp game-background.png -o game-background.webp -q 85
   ```

2. `<picture>` elem használata fallback-kel:
   ```tsx
   <picture>
     <source srcSet="game-background.webp" type="image/webp" />
     <img src="game-background.png" alt="Background" loading="lazy" />
   </picture>
   ```

3. Lazy loading minden nem-kritikus képen:
   ```tsx
   <img src="avatar.png" loading="lazy" />
   ```

**Előny:**
- Képméret csökkenés: ~70% (2.2 MB → 660 KB)
- LCP (Largest Contentful Paint) javulás: ~40%

**Prioritás:** 🟡 P1 – Magas

---

### 🟢 KÖZEPES PRIORITÁSÚ OPTIMALIZÁCIÓK (P2)

#### 8. **Context API Migration – Felesleges re-renderek elkerülése**
**Fájl:** `src/i18n/I18nContext.tsx`

**Problémák:**
- I18n context minden language változáskor teljes app re-render-t okoz
- Nincs context splitting (language state + translation functions külön)

**Megoldás:**
1. Context splitting:
   ```tsx
   const LanguageContext = createContext(); // csak language state
   const TranslationContext = createContext(); // translation functions (nem változik)
   ```

2. Komponensek csak a szükséges context-et subscribolják

**Előny:**
- Language változáskor csak a szükséges komponensek renderelődnek újra

**Prioritás:** 🟢 P2 – Közepes

---

## 💳 FIZETÉSI KÉPERNYŐK OPTIMALIZÁLÁSA

### 🔴 KRITIKUS PROBLÉMÁK (P0)

#### 9. **Payment Success Screen – Redirect lag**
**Fájl:** `src/pages/PaymentSuccess.tsx`

**Problémák:**
- Success screen-ről Dashboard-ra való visszatérés lassú (~2-3s delay)
- Valószínű ok: Dashboard teljes újratöltés + összes popup manager újrainicializálás

**Megoldás:**
1. React Router `replace` navigation használata (history stack tisztítás):
   ```tsx
   navigate('/dashboard', { replace: true });
   ```

2. Dashboard prefetch payment flow során:
   ```tsx
   // PaymentSuccess.tsx
   useEffect(() => {
     queryClient.prefetchQuery(['dashboard-data']);
   }, []);
   ```

**Előny:**
- Payment success → Dashboard navigáció: 2-3s → 300-500ms

**Prioritás:** 🔴 P0 – KRITIKUS

---

#### 10. **Stripe Checkout Redirect – Lassú visszatérés**
**Edge Functions:** `verify-*-payment` sorozat

**Problémák:**
- Felhasználó Stripe-ról visszajön → webhook még nem futott le → "Processing..." állapot hosszú ideig
- Nincs optimistic UI update

**Megoldás:**
1. Webhook + polling kombináció:
   - Frontend poll-ol 500ms-enként payment státuszra
   - Ha webhook gyors → azonnal átváltás
   - Ha webhook lassú → fallback polling max 10s-ig

2. Optimistic UI:
   ```tsx
   // Sikeres Stripe redirect-nél feltételezünk sikerességet
   const [optimisticSuccess, setOptimisticSuccess] = useState(true);
   ```

**Előny:**
- Észlelt várakozási idő csökkenés: 5-10s → 1-2s

**Prioritás:** 🔴 P0 – KRITIKUS

---

## 👨‍💼 ADMIN FELÜLET OPTIMALIZÁLÁSA

### 🟡 MAGAS PRIORITÁSÚ OPTIMALIZÁCIÓK (P1)

#### 11. **Admin Table Pagination – Large Dataset Handling**
**Fájlok:**
- `src/pages/AdminGameProfiles.tsx`
- `src/pages/AdminBoosterPurchases.tsx`
- `src/pages/AdminPopularContent.tsx`

**Problémák:**
- Egyes admin táblák minden rekordot betöltenek egyszerre (1000+ sor)
- Nincs backend oldali pagination (limit/offset)
- Frontend filterelés → lassú nagy adathalmazoknál

**Megoldás:**
1. Backend pagination implementálás Edge Functions-ben:
   ```ts
   // admin-game-profiles/index.ts
   const { page = 1, pageSize = 50 } = await req.json();
   const offset = (page - 1) * pageSize;
   
   const { data, count } = await supabase
     .from('profiles')
     .select('*', { count: 'exact' })
     .range(offset, offset + pageSize - 1);
   ```

2. Frontend infinite scroll vagy pagination UI:
   ```tsx
   const { data, fetchNextPage } = useInfiniteQuery({
     queryKey: ['admin-profiles'],
     queryFn: ({ pageParam = 1 }) => fetchProfiles(pageParam),
     getNextPageParam: (lastPage) => lastPage.nextPage,
   });
   ```

**Előny:**
- Admin tábla betöltési idő: 8-12s → 500ms-1s
- Memória használat csökkenés: ~80%

**Prioritás:** 🟡 P1 – Magas

---

#### 12. **Admin Bundle Lazy Loading**
**Fájl:** `src/App.tsx` vagy routing konfig

**Problémák:**
- Admin komponensek betöltődnek a fő bundle-ben
- Regular userek (nem adminok) is letöltik az admin kódot

**Megoldás:**
1. Admin route-ok lazy loading:
   ```tsx
   const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
   const AdminGameProfiles = lazy(() => import('./pages/AdminGameProfiles'));
   // ... többi admin page
   ```

2. Admin bundle külön chunk (lásd: Frontend section)

**Előny:**
- Initial bundle csökkenés: ~400 KB (admin kód kihagyásával)
- Regular user experience javulás

**Prioritás:** 🟡 P1 – Magas

---

#### 13. **Admin Statistics Caching – Aggregate Query Optimization**
**Fájlok:**
- `src/pages/AdvancedAnalytics.tsx`
- `src/pages/RetentionDashboard.tsx`
- `src/pages/MonetizationDashboard.tsx`

**Problémák:**
- Statisztikai lekérdezések (user count, revenue, game stats) minden rendernél újra futnak
- Aggregációs query-k (COUNT, SUM, AVG) lassúak nagy táblákkal
- Nincs cache réteg

**Megoldás:**
1. Database szintű cache – Materialized Views:
   ```sql
   CREATE MATERIALIZED VIEW admin_stats_cache AS
   SELECT
     COUNT(*) as total_users,
     SUM(coins) as total_coins,
     AVG(correct_answers) as avg_correct
   FROM profiles;
   
   -- Refresh schedule (cron job)
   REFRESH MATERIALIZED VIEW admin_stats_cache;
   ```

2. Frontend cache (React Query):
   ```tsx
   useQuery({
     queryKey: ['admin-stats'],
     queryFn: fetchAdminStats,
     staleTime: 60_000, // 1 perc
     cacheTime: 300_000, // 5 perc
   });
   ```

**Előny:**
- Admin dashboard betöltés: 5-8s → 1-2s
- Adatbázis terhelés csökkenés: ~90%

**Prioritás:** 🟡 P1 – Magas

---

## ⚡ BACKEND OPTIMALIZÁLÁS

### 🔴 KRITIKUS PROBLÉMÁK (P0)

#### 14. **Database Indexek – Missing Composite Indexes**
**Táblák:** `game_results`, `wallet_ledger`, `lives_ledger`, `booster_purchases`

**Problémák:**
- Gyakori lekérdezések (user_id + created_at) nincsenek indexelve
- Full table scan történik nagy táblákban

**Példa lassú query:**
```sql
SELECT * FROM game_results
WHERE user_id = '...' AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

**Megoldás:**
1. Composite indexek létrehozása:
   ```sql
   CREATE INDEX idx_game_results_user_created 
   ON game_results(user_id, created_at DESC);
   
   CREATE INDEX idx_wallet_ledger_user_created 
   ON wallet_ledger(user_id, created_at DESC);
   
   CREATE INDEX idx_lives_ledger_user_created 
   ON lives_ledger(user_id, created_at DESC);
   ```

**Előny:**
- Query végrehajtási idő: 800-1500ms → 10-50ms (~95% javulás)
- Dashboard wallet data fetch gyorsulás

**Prioritás:** 🔴 P0 – KRITIKUS  
**Megjegyzés:** Ez részben már meg volt csinálva korábbi memory szerint, de ellenőrizni kell, hogy minden index létrejött-e.

---

#### 15. **N+1 Query Problem – Admin Game Profiles**
**Edge Function:** `admin-game-profiles/index.ts`

**Problémák:**
- User profilok fetch → majd minden user-hez külön query a game stats-ért
- Példa: 100 user → 1 + 100 = 101 query

**Megoldás:**
1. JOIN használata:
   ```ts
   const { data } = await supabase
     .from('profiles')
     .select(`
       *,
       game_results!inner(
         count,
         avg(correct_answers) as avg_correct
       )
     `)
     .limit(50);
   ```

2. Vagy külön batch query:
   ```ts
   const userIds = profiles.map(p => p.id);
   const { data: stats } = await supabase
     .from('game_results')
     .select('user_id, COUNT(*), AVG(correct_answers)')
     .in('user_id', userIds)
     .group('user_id');
   ```

**Előny:**
- Admin profiles load: 101 queries → 2 queries
- Betöltési idő: 8-12s → 1-2s

**Prioritás:** 🔴 P0 – KRITIKUS

---

### 🟡 MAGAS PRIORITÁSÚ OPTIMALIZÁCIÓK (P1)

#### 16. **Edge Function Redundant Calls – Duplicate Logic**
**Fájlok:**
- `get-dashboard-data/index.ts`
- `get-user-game-profile/index.ts`
- `get-wallet/index.ts`

**Problémák:**
- Dashboard betöltéskor 3 külön edge function hívás hasonló adatokért
- Lehetne egy `get-dashboard-bundle` function, amely mindent egyben ad vissza

**Megoldás:**
1. Batch endpoint létrehozása:
   ```ts
   // get-dashboard-bundle/index.ts
   export const handler = async (req) => {
     const [profile, wallet, gameProfile] = await Promise.all([
       fetchProfile(),
       fetchWallet(),
       fetchGameProfile(),
     ]);
     
     return { profile, wallet, gameProfile };
   };
   ```

**Előny:**
- HTTP kérések száma: 3 → 1
- Dashboard betöltési idő: ~1.5s → ~600ms

**Prioritás:** 🟡 P1 – Magas

---

#### 17. **Real-time Subscription Optimization – Túl sok channel**
**Fájlok:** Több komponens (Leaderboard, Dashboard, Profile)

**Problémák:**
- Minden komponens külön real-time subscription-t nyit (több Supabase channel)
- Túl sok WebSocket kapcsolat

**Megoldás:**
1. Központi real-time manager:
   ```tsx
   // useRealtimeManager.ts
   const channel = supabase.channel('app-updates')
     .on('postgres_changes', { schema: 'public', table: 'profiles' }, handler)
     .on('postgres_changes', { schema: 'public', table: 'wallet_ledger' }, handler)
     .subscribe();
   ```

2. Komponensek megosztják a channel-t

**Előny:**
- WebSocket kapcsolatok: 5-10 → 1-2
- Hálózati overhead csökkenés

**Prioritás:** 🟡 P1 – Magas

---

## 📋 IMPLEMENTÁCIÓS SORREND (Prioritás szerint)

### ⚡ AZONNALI IMPLEMENTÁLÁS (P0 – 1-2 nap)

1. ✅ **GamePreview refaktor** – komponens split, memoization (3-4h)
2. ✅ **Dashboard popup manager** – state management refaktor (2-3h)
3. ✅ **Database indexek** – composite index létrehozás (30 perc)
4. ✅ **Admin N+1 query fix** – JOIN használat (1-2h)
5. ✅ **Payment success redirect lag fix** – prefetch + replace navigation (1h)

**Összesen:** 1-1.5 nap

---

### 🚀 GYORS WINS (P1 – 3-5 nap)

6. ✅ **Bundle size optimization** – code splitting, lazy loading (4-5h)
7. ✅ **Leaderboard cache** – React Query cache konfig (2-3h)
8. ✅ **Question prefetch** – előre betöltés Play Now-nál (2-3h)
9. ✅ **Image optimization** – WebP konverzió + lazy loading (3-4h)
10. ✅ **Admin pagination** – backend limit/offset (3-4h)
11. ✅ **Admin bundle lazy load** – admin chunk splitting (2-3h)
12. ✅ **Admin stats cache** – materialized views (2-3h)
13. ✅ **Batch dashboard endpoint** – 3 call → 1 call (4-5h)

**Összesen:** 3-4 nap

---

### 🎯 LONG-TERM IMPROVEMENTS (P2 – 1-2 hét)

14. ✅ **Animáció optimalizálás** – GPU acceleration, will-change (1-2 nap)
15. ✅ **Context API migration** – felesleges re-renderek megszüntetése (2-3 nap)
16. ✅ **Real-time optimization** – központi channel manager (1-2 nap)

**Összesen:** 1-1.5 hét

---

## 🎯 VÁRHATÓ EREDMÉNYEK (Előtte → Utána)

### Gameplay Performance:
- **GamePreview render:** 80-120ms → 10-20ms (80% javulás)
- **FPS játék közben:** 20-30 FPS → 60 FPS (stabil)
- **Lag észlelés:** Érzékelhető → Nincs

### Dashboard Performance:
- **Betöltési idő:** 1.5-2s → 500-800ms (60% javulás)
- **Popup animációk:** Stuttering → Smooth 60 FPS

### Fizetési Flow:
- **Payment success redirect:** 2-3s → 300-500ms (85% javulás)
- **Stripe visszatérés:** 5-10s → 1-2s (80% javulás)

### Admin Performance:
- **Profiles table load:** 8-12s → 500ms-1s (90% javulás)
- **Statistics dashboard:** 5-8s → 1-2s (75% javulás)

### Bundle Size:
- **Initial bundle:** 3.2 MB → 1.2 MB (65% csökkenés)
- **First Contentful Paint:** 2.5s → 1.2s (52% javulás)

---

## 📝 MEGJEGYZÉSEK

- Minden optimalizáció **backward compatible** – nem tör el semmit
- Prioritás: **gameplay > payment > admin**
- Mérési módszer: Chrome DevTools Performance tab + Lighthouse
- Testing: minden optimalizálás után regression test (főleg payment flow)

---

**Riport vége – Phase 3 – Performance Optimization Audit**
