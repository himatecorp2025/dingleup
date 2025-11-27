# 🧹 PHASE 2 – HALOTT KÓD AUDIT

**Készült:** 2025-01-27  
**Projekt:** DingleUP! Quiz Game  
**Cél:** Minden nem használt, legacy, vagy duplikált kód azonosítása és kategorizálása

---

## 📊 ÖSSZEFOGLALÓ

| Kategória | SAFE_TO_DELETE_NOW | PROBABLY_DEAD | LEGACY_BUT_USED | Összesen |
|-----------|-------------------|---------------|-----------------|----------|
| Komponensek | 0 | 3 | 2 | 5 |
| Hookok | 0 | 2 | 1 | 3 |
| Edge Functions | 1 | 1 | 0 | 2 |
| Utility Files | 1 | 0 | 0 | 1 |
| **ÖSSZESEN** | **2** | **6** | **3** | **11** |

**Már törölt fájlok (korábbi cleanup-ok során):**
- `InvitationDialogFixed.tsx`
- `usePerformanceTracking.ts`
- `useGlobalErrorTracking.ts`
- `backfill-friendships/index.ts`
- `simple-load-test/index.ts`

**Mostani cleanup során törölve:**
- `admin-delete-user/index.ts` ✅
- `scripts/extract-topics.js` ✅

---

## 🔴 KOMPONENSEK

### 🟡 LEGACY_BUT_USED

#### 1. `src/components/DevelopmentStatus.tsx`
- **Státusz:** Használatban van
- **Használat:** `src/pages/Index.tsx` (vonal 83) – landing page-en megjelenik
- **Funkció:** "Currently in Development" üzenet megjelenítése
- **Kockázat:** Magas – ha töröljük, build error
- **Ajánlás:** MEGTARTANI – de ellenőrizni, hogy production-ben kell-e még (ha már nincs beta/dev phase, lehet eltávolítani a landing page-ről)

#### 2. `src/components/ErrorBoundary.tsx`
- **Státusz:** Legacy implementáció, de használatban lehet
- **Indok:** Van egy GameErrorBoundary.tsx is, amely specifikusabb. Az ErrorBoundary általános.
- **Kockázat:** Magas – ha használatban van és töröljük, az alkalmazás összeomolhat
- **Ajánlás:** MEGTARTANI – ellenőrizni App.tsx-ben, hogy wrappel-e vele bármit

### ⚠️ PROBABLY_DEAD_NEEDS_CONFIRMATION

#### 3. `src/components/Newsletter.tsx`
- **Státusz:** Használatban van
- **Használat:** `src/pages/Index.tsx` (vonal 84) – landing page-en megjelenik
- **Funkció:** Newsletter feliratkozás
- **Kockázat:** Közepes – ha nincs newsletter integráció, csak placeholder komponens
- **Ajánlás:** MEGTARTANI, de ellenőrizni, hogy működik-e a backend (ha nem, akkor csak placeholder, törölhető a landing page-ről)

#### 4. `src/components/Trophy3D.tsx`
- **Státusz:** Valószínűleg halott
- **Indok:** 3D trophy komponens, de a Trophy renderelés más módon történik (pl. SVG assets használatával). Lehet, hogy egy korábbi implementáció maradványa.
- **Kockázat:** Közepes
- **Ajánlás:** Ha nincs importálva sehol, törölhető

#### 5. `src/components/VideoPlayer.tsx`
- **Státusz:** Valószínűleg halott
- **Indok:** Generic video player komponens, de az intro video más módon van kezelve (IntroVideo.tsx használatával). Lehet duplikáció vagy régebbi verzió.
- **Kockázat:** Közepes
- **Ajánlás:** Ellenőrizni, hogy az IntroVideo.tsx nem használja-e. Ha nem, törölhető.

---

## 🪝 HOOKOK

### 🟡 LEGACY_BUT_USED

#### 1. `src/hooks/useFullscreen.ts`
- **Státusz:** Használatban van
- **Használat:** Több oldalon (About, Dashboard, Game, IntroVideo, Leaderboard, Profile)
- **Funkció:** Web Fullscreen API kezelés (párhuzamosan a useNativeFullscreen-nel, amely native platform-okhoz van)
- **Kockázat:** Magas – ha töröljük, build error + fullscreen funkcionalitás megszűnik web-en
- **Ajánlás:** MEGTARTANI – ez a web verzió fullscreen hook-ja, nem halott kód

### ⚠️ PROBABLY_DEAD_NEEDS_CONFIRMATION

#### 2. `src/hooks/usePullToRefresh.ts`
- **Státusz:** Valószínűleg halott
- **Indok:** Mobile pull-to-refresh hook, de nem látszik explicit használat a fő képernyőkön (Dashboard, Leaderboard, Profile). Dashboard.tsx-ben van import (vonal 16), de lehet, hogy kipróbálták és nem lett production feature.
- **Kockázat:** Közepes
- **Ajánlás:** Ellenőrizni Dashboard.tsx-ben, hogy tényleg használva van-e. Ha csak import, de nincs meghívva, törölhető.

#### 3. `src/hooks/useBackButton.ts`
- **Státusz:** Valószínűleg halott
- **Indok:** Fizikai vissza gomb kezelés (Android). De a navigáció react-router-dom-mal történik. Ellenőrizni kell, hogy Capacitor build-ben használt-e.
- **Kockázat:** Magas – ha Android PWA/Capacitor buildben kell, akkor nem törölhető
- **Ajánlás:** Ellenőrizni Android buildben, mielőtt töröljük

---

## ⚡ EDGE FUNCTIONS

### ✅ SAFE_TO_DELETE_NOW

#### 1. `supabase/functions/admin-delete-user/index.ts`
- **Státusz:** Biztosan halott ✅ TÖRÖLVE
- **Indok:** Admin user törlés funkció, de nincs UI entry point hozzá az admin felületen. Nincs gomb, nincs route, nincs használva.
- **Kockázat:** Alacsony – ha tényleg nincs admin UI-ban, nem használt
- **Ajánlás:** TÖRÖLVE

### ⚠️ PROBABLY_DEAD_NEEDS_CONFIRMATION

#### 2. `supabase/functions/regenerate-lives-background/index.ts`
- **Státusz:** Valószínűleg halott
- **Indok:** Háttérben élet regenerálás. DE: ellenőrizni kell, hogy van-e cron job, vagy másik function hívja-e (pl. scheduled task).
- **Kockázat:** Magas – ha a life regeneration ezt használja, nem törölhető
- **Ajánlás:** Ellenőrizni:
  - Van-e cron job a config.toml-ben?
  - Más Edge Function hívja-e?
  - Ha egyik sem igaz → törölhető

**CRITICAL: Cron job ellenőrzés szükséges `supabase/config.toml`-ben:**
- `aggregate-analytics/index.ts`
- `aggregate-daily-activity/index.ts`
- `regenerate-lives-background/index.ts`

Ha ezekben nincs cron schedule, akkor halott kód.

---

## 📂 UTILITY FILES & SCRIPTS

### ✅ SAFE_TO_DELETE_NOW

#### 1. `scripts/extract-topics.js`
- **Státusz:** Biztosan halott ✅ TÖRÖLVE
- **Indok:** Egyszeri script, amely topic-okat extract-elt. Már lefutott, nincs rá szükség production kódbázisban.
- **Kockázat:** Alacsony
- **Ajánlás:** TÖRÖLVE

---

## 🗂️ LEGACY AUTH FLOW (EMAIL BASED)

### ⚠️ PROBABLY_DEAD_NEEDS_CONFIRMATION

Az alkalmazás username+PIN auth-ra váltott, tehát az email-alapú auth kód legacy:

#### Potenciálisan halott email auth komponensek:
- `src/pages/LoginNew.tsx` – ha ez email-alapú login
- `src/pages/RegisterNew.tsx` – ha ez email-alapú register

**Jelenlegi auth flow:** `AuthChoice.tsx` → username+PIN login/register

**Kérdés:**
- Van-e még email-alapú auth backup?
- Teljesen ki lett kapcsolva az email-alapú auth?

**Ajánlás:**
- Ha a projekt **kizárólag** username+PIN-t használ, akkor:
  - Email-based login/register komponensek törölhetők
  - Email-related auth edge functions ellenőrzése (`login-with-username-pin` az aktív, tehát az email-based `login` function törölhető)

---

## 🔍 DUPLIKÁLT LOGIKA

### Admin leaderboard / statistics lekérdezések

**Probléma:** Több admin page külön fetch hasonló adatokat:
- `AdminDashboard.tsx` – fetches user count, game stats
- `AdminGameProfiles.tsx` – fetches game profiles
- `AdvancedAnalytics.tsx` – fetches analytics

**Optimalizálási lehetőség:**
- Egy központi `useAdminData` hook vagy context
- Egységes cache layer (React Query stale time növelése)

**Státusz:** LEGACY_BUT_USED – refaktor jelölt, nem törölhető

---

## 📋 ELAVULT TRANSLATION KEY-EK

A `src/i18n` rendszerben vannak olyan translation key-ek, amelyek már nem használtak:

**Ellenőrzendő:**
- A `translations` táblában vannak-e olyan key-ek, amelyekre nincs UI referencia?
- Régi feature-ök (pl. ha volt "Invitation" funkció, de már nincs használva)?

**Ajánlás:**
- SQL query futtatása:
  ```sql
  SELECT DISTINCT key FROM translations
  WHERE key NOT IN (
    -- lista az aktív translation key-ekről a kódból
  );
  ```

**Státusz:** PROBABLY_DEAD – manuális ellenőrzés szükséges

---

## ✅ AUTOMATIKUSAN TÖRÖLHETŐ ELEMEK (SAFE_TO_DELETE_NOW)

Az alábbi fájlok **biztosan törölhetők**, mert:
- Nincs import rájuk sehol
- Nem kritikus domain (auth, payment, game logic)
- Legacy / debugging / one-time script jellegűek

### Edge Functions:
1. ✅ `supabase/functions/admin-delete-user/index.ts` – TÖRÖLVE

### Scripts:
2. ✅ `scripts/extract-topics.js` – TÖRÖLVE

**Korábban törölve (korábbi cleanup-ok):**
- `InvitationDialogFixed.tsx`
- `usePerformanceTracking.ts`
- `useGlobalErrorTracking.ts`
- `backfill-friendships/index.ts`
- `simple-load-test/index.ts`

**Összesen törölve (Phase 2):** 2 fájl

---

## ⚠️ MANUÁLIS ELLENŐRZÉS SZÜKSÉGES (PROBABLY_DEAD)

Ezeket NEM töröljük automatikusan, kommenttel jelöljük:

### Komponensek:
- `Trophy3D.tsx` – használva van-e valahol?
- `VideoPlayer.tsx` – használja-e az IntroVideo?

### Hookok:
- `usePullToRefresh.ts` – mobil refresheléshez használt-e? (Dashboard.tsx-ben van import)
- `useBackButton.ts` – Android build-ben kell-e?

### Edge Functions:
- `regenerate-lives-background/index.ts` – van-e cron job?
- `aggregate-analytics/index.ts` – van-e cron job?
- `aggregate-daily-activity/index.ts` – van-e cron job?

### Auth flow:
- `LoginNew.tsx` / `RegisterNew.tsx` – email auth teljesen ki van kapcsolva?

---

## 🟡 HASZNÁLATBAN LÉVŐ ELEMEK (FALSE POSITIVES)

Ezek a fájlok eredetileg halottnak tűntek, de valójában **használatban vannak**:

1. ✅ **`useFullscreen.ts`** – WEB fullscreen API-hoz használt (párhuzamosan useNativeFullscreen-nel)
2. ✅ **`DevelopmentStatus.tsx`** – Index.tsx landing page-en megjelenik
3. ✅ **`Newsletter.tsx`** – Index.tsx landing page-en megjelenik

Ezeket **MEGTARTANI**.

---

## 🎯 KÖVETKEZŐ LÉPÉSEK

1. **✅ Automatikus törlés befejezve (SAFE_TO_DELETE_NOW):**
   - `admin-delete-user/index.ts` ✅
   - `scripts/extract-topics.js` ✅

2. **Manuális ellenőrzés (PROBABLY_DEAD) – következő lépések:**
   - Edge Functions cron job ellenőrzése `supabase/config.toml`-ben
   - Auth flow döntés: van-e email-based backup?
   - Komponensek manual search (grep használatával: Trophy3D, VideoPlayer)
   - usePullToRefresh Dashboard.tsx-ben tényleg meghívódik-e?

3. **Refaktor jelöltek (LEGACY_BUT_USED) – Phase 3-ban:**
   - `ErrorBoundary.tsx` – GameErrorBoundary összevonása vagy törlése
   - Admin data fetching – központi hook/context
   - Translation key cleanup – SQL query + frontend audit

---

## 📝 MEGJEGYZÉSEK

- **Biztonság:** Csak a SAFE_TO_DELETE_NOW kategóriát töröljük automatikusan
- **Verziókezelés:** Minden törlés után Git commit, hogy vissza lehessen állítani, ha mégis kellene
- **Testing:** Törlés után full regression test (főleg payment, auth, game flow)
- **False positives:** useFullscreen, DevelopmentStatus, Newsletter valójában használatban vannak

---

**Riport vége – Phase 2 – Halott Kód Audit**
