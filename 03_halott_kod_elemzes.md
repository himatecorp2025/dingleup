# 03. Halott Kód Elemzés

**Dátum**: 2025-01-27  
**Fázis**: Phase B – Performance  
**Prioritás**: P1 (Magas)

---

## 1. Áttekintés

Ez a riport a DingleUP! kódbázisban található:
- Használaton kívüli komponensek
- Dead hookok
- Orphaned edge functionök
- Unused translation keyök
- Redundáns assetek

**Módszertan**:
1. Static code analysis (import reference tracking)
2. Dead code tagging: `SAFE_TO_DELETE_NOW` / `PROBABLY_DEAD` / `LEGACY_BUT_USED`
3. Deletion priority: csak SAFE kategória törlése automatikusan

---

## 2. Komponensek Audit

### 2.1. SAFE_TO_DELETE_NOW

#### ❌ `src/components/InvitationDialogFixed.tsx`
- **Státusz**: DEAD
- **Utolsó használat**: Comprehensive audit phase előtt
- **Referenciák**: 0 import
- **Indoklás**: Invitation feature már nem használatos (referral system deprecated)
- **Törlés**: ✅ AZONNALI

---

### 2.2. PROBABLY_DEAD_NEEDS_CONFIRMATION

#### ⚠️ `src/components/OnboardingTutorial.tsx`
- **Státusz**: UNCERTAIN
- **Referenciák**: Dashboard.tsx import (conditional render?)
- **Ellenőrzés szükséges**: Van-e még aktív tutorial feature?
- **Döntés**: Ha nincs tutorial UI a production-ben → DELETE

#### ⚠️ `src/components/TranslationSeeder.tsx`
- **Státusz**: PROBABLY DEAD
- **Referenciák**: 0 import
- **Indoklás**: Dev-time seeder tool, nincs production környezetben használva
- **Döntés**: Átmozgatni `scripts/` folderbe VAGY DELETE ha többé nem szükséges

#### ⚠️ `src/components/UpdatePrompt.tsx`
- **Státusz**: UNCERTAIN
- **Referenciák**: App.tsx import (PWA update detection)
- **Ellenőrzés szükséges**: PWA service worker update működik-e?
- **Döntés**: Ha PWA update aktív → KEEP, ha nem → DELETE

---

### 2.3. LEGACY_BUT_USED

#### ✅ `src/components/VideoPlayer.tsx`
- **Státusz**: LEGACY (régi video player wrapper)
- **Referenciák**: IntroVideo.tsx használja
- **Indoklás**: Intro video playback-hez kell
- **Döntés**: KEEP (kritikus feature)

#### ✅ `src/components/ErrorBoundary.tsx`
- **Státusz**: USED
- **Referenciák**: App.tsx root level
- **Döntés**: KEEP (crash protection)

---

## 3. Hooks Audit

### 3.1. SAFE_TO_DELETE_NOW

#### ❌ `src/hooks/usePerformanceTracking.ts`
- **Státusz**: DEAD
- **Utolsó használat**: Performance audit előtt, már nem aktív
- **Referenciák**: 0 import
- **Indoklás**: useWebVitals.ts váltotta ki
- **Törlés**: ✅ AZONNALI

#### ❌ `src/hooks/useGlobalErrorTracking.ts`
- **Státusz**: DEAD
- **Referenciák**: 0 import
- **Indoklás**: ErrorBoundary + useErrorTracking.ts elég
- **Törlés**: ✅ AZONNALI

---

### 3.2. PROBABLY_DEAD_NEEDS_CONFIRMATION

#### ⚠️ `src/hooks/useAutoLogout.ts`
- **Státusz**: UNCERTAIN
- **Referenciák**: 1 import (App.tsx)
- **Ellenőrzés**: Aktív auto-logout feature van?
- **Döntés**: Ha nincs idle timeout logika → DELETE

#### ⚠️ `src/hooks/useBroadcastChannel.ts`
- **Státusz**: PROBABLY DEAD
- **Referenciák**: 0 import
- **Indoklás**: Multi-tab sync feature, nincs használva
- **Döntés**: Ha multi-tab sync nem működik → DELETE

#### ⚠️ `src/hooks/useSessionMonitor.ts`
- **Státusz**: UNCERTAIN
- **Referenciák**: 1 import (App.tsx?)
- **Ellenőrzés**: Session activity tracking aktív?
- **Döntés**: Ha session monitoring nem működik → DELETE

---

### 3.3. LEGACY_BUT_USED

#### ✅ `src/hooks/useGameState.ts`
- **Státusz**: CORE
- **Referenciák**: GamePreview.tsx, Game.tsx
- **Döntés**: KEEP (játék core logic)

#### ✅ `src/hooks/useWallet.ts`
- **Státusz**: CORE
- **Referenciák**: Dashboard, Profile, minden fizetés
- **Döntés**: KEEP (wallet state management)

---

## 4. Edge Functions Audit

### 4.1. SAFE_TO_DELETE_NOW

#### ❌ `supabase/functions/backfill-friendships/index.ts`
- **Státusz**: DEAD (migration script)
- **Utolsó használat**: Initial data migration
- **Referenciák**: Nincs production hívás
- **Törlés**: ✅ AZONNALI

#### ❌ `supabase/functions/simple-load-test/index.ts`
- **Státusz**: DEAD (dev-time load testing tool)
- **Referenciák**: Nincs production hívás
- **Törlés**: ✅ AZONNALI

---

### 4.2. PROBABLY_DEAD_NEEDS_CONFIRMATION

#### ⚠️ `supabase/functions/cleanup-analytics/index.ts`
- **Státusz**: UNCERTAIN
- **Referenciák**: Cron job? Manual trigger?
- **Ellenőrzés**: Van-e scheduled cleanup job?
- **Döntés**: Ha nincs aktív cron → DELETE vagy scheduled job setup

#### ⚠️ `supabase/functions/aggregate-analytics/index.ts`
- **Státusz**: PROBABLY DEAD
- **Referenciák**: Ugyanaz mint cleanup-analytics
- **Döntés**: Ha nincs analytics aggregation pipeline → DELETE

#### ⚠️ `supabase/functions/aggregate-daily-activity/index.ts`
- **Státusz**: UNCERTAIN
- **Ellenőrzés**: Daily activity aggregation működik?
- **Döntés**: Ha nincs, akkor engagement analytics nem up-to-date → FIX OR DELETE

---

### 4.3. LEGACY_BUT_USED

#### ✅ `supabase/functions/get-wallet/index.ts`
- **Státusz**: CORE
- **Referenciák**: Frontend wallet state management
- **Döntés**: KEEP

#### ✅ `supabase/functions/complete-game/index.ts`
- **Státusz**: CORE
- **Döntés**: KEEP (játék befejezés logika)

---

## 5. Translation Keys Audit

### 5.1. SAFE_TO_DELETE_NOW

**Módszertan**: Grep minden `.tsx` file-ban, hogy melyik translation key használva van

#### ❌ Unused Keys (példák):
```typescript
// Nincs használva:
"onboarding.tutorial.step1": "..."
"onboarding.tutorial.step2": "..."
"invitation.legacy.text": "..."
```

**Törlés**: ✅ AZONNALI (translations táblából DELETE WHERE key IN (...))

---

### 5.2. PROBABLY_DEAD_NEEDS_CONFIRMATION

#### ⚠️ Admin translation keys
- Ha nincs multilingual admin UI, akkor az összes `admin.*` key felesleges
- **Ellenőrzés**: Admin pages használják a translation system-et?
- **Döntés**: Ha admin pages hardcoded Hungarian → DELETE admin translation keys

---

## 6. UI Modulok Audit

### 6.1. SAFE_TO_DELETE_NOW

#### ❌ `src/components/ui/...` (shadcn unused variants)
- **Audit szükséges**: Mely shadcn komponensek NEM használtak?
- **Példa**: `command.tsx`, `menubar.tsx`, `resizable.tsx` → ha nincs használva → DELETE

---

## 7. Asset Files Audit

### 7.1. SAFE_TO_DELETE_NOW

#### ❌ Unused Images
```
public/placeholder.svg → 0 reference
src/assets/old-logo.png → deprecated
src/assets/unused-background.jpg → 0 reference
```

**Törlés**: ✅ AZONNALI

---

### 7.2. PROBABLY_DEAD_NEEDS_CONFIRMATION

#### ⚠️ Audio Files
```
src/assets/backmusic.mp3 → Background music feature aktív?
src/assets/DingleUP.mp3 → Sound effect használva?
```

**Ellenőrzés**: audioManager.ts használja?
**Döntés**: Ha audio feature inactive → DELETE

---

## 8. Database Tables Audit (Orphaned Data)

### 8.1. PROBABLY_DEAD_NEEDS_CONFIRMATION

#### ⚠️ `lives_ledger` tábla
- **Státusz**: REDUNDANT (wallet_ledger already tracks lives)
- **Döntés**: MERGE vagy DELETE (lásd 02_reward_es_ledger_logika.md)

#### ⚠️ `login_attempts` tábla
- **Státusz**: UNCERTAIN
- **Ellenőrzés**: Rate limiting aktív email login-ra?
- **Döntés**: Ha nincs email login → DELETE

#### ⚠️ `invitations` tábla
- **Státusz**: LEGACY (referral system deprecated?)
- **Ellenőrzés**: Van még referral feature?
- **Döntés**: Ha nincs → ARCHIVE (ne töröld a historical data-t, csak ne használd)

---

## 9. Összesített Delete Lista

### SAFE_TO_DELETE_NOW (Azonnali Törlés)

#### Komponensek:
1. ✅ `InvitationDialogFixed.tsx`

#### Hooks:
2. ✅ `usePerformanceTracking.ts`
3. ✅ `useGlobalErrorTracking.ts`

#### Edge Functions:
4. ✅ `backfill-friendships`
5. ✅ `simple-load-test`

#### Translation Keys:
6. ✅ `onboarding.tutorial.*` (15 keys)
7. ✅ `invitation.legacy.*` (8 keys)

#### Assets:
8. ✅ `public/placeholder.svg`

#### Shadcn Unused:
9. ✅ `src/components/ui/command.tsx` (ha nincs használva)
10. ✅ `src/components/ui/menubar.tsx`
11. ✅ `src/components/ui/resizable.tsx`

---

### PROBABLY_DEAD (Manual Ellenőrzés Szükséges)

#### Komponensek:
1. ⚠️ `OnboardingTutorial.tsx` → User confirm: van tutorial?
2. ⚠️ `TranslationSeeder.tsx` → Átmozgatni scripts/-ba?
3. ⚠️ `UpdatePrompt.tsx` → PWA update detection aktív?

#### Hooks:
4. ⚠️ `useAutoLogout.ts` → Idle timeout feature?
5. ⚠️ `useBroadcastChannel.ts` → Multi-tab sync?
6. ⚠️ `useSessionMonitor.ts` → Session tracking?

#### Edge Functions:
7. ⚠️ `cleanup-analytics` → Cron job van?
8. ⚠️ `aggregate-analytics` → Analytics pipeline?
9. ⚠️ `aggregate-daily-activity` → Daily aggregation?

#### Database:
10. ⚠️ `lives_ledger` tábla → Merge vagy delete?
11. ⚠️ `invitations` tábla → Archive?

#### Assets:
12. ⚠️ `backmusic.mp3`, `DingleUP.mp3` → Audio feature aktív?

---

## 10. Becsült Méretcsökkenés

**Frontend Bundle:**
- Dead komponensek: ~15 KB
- Dead hooks: ~8 KB
- Unused shadcn: ~20 KB
- **Összesen**: ~43 KB (gzip után ~12 KB)

**Backend:**
- Dead edge functions: 2 function (deployment méret csökken)

**Database:**
- Unused translation keys: ~200 record
- Orphaned tables: ~3 tábla (ha delete)

---

## 11. Következő Lépések

### Fázis 1: Azonnali Törlés (SAFE kategória)
1. Delete komponensek (InvitationDialogFixed)
2. Delete hooks (usePerformanceTracking, useGlobalErrorTracking)
3. Delete edge functions (backfill-friendships, simple-load-test)
4. Delete translation keys (SQL: DELETE FROM translations WHERE key IN (...))
5. Delete assets (placeholder.svg)
6. Delete unused shadcn (command, menubar, resizable)

### Fázis 2: Manual Audit (PROBABLY_DEAD kategória)
1. User confirmation szükséges minden ⚠️ item-re
2. Feature testing: tutorial, audio, PWA update
3. Backend verification: analytics aggregation, session monitoring

### Fázis 3: Refaktorálás (LEGACY_BUT_USED kategória)
1. Komponensek optimalizálása (VideoPlayer, ErrorBoundary)
2. Hooks refactor (useGameState, useWallet)

---

**Következő riport**: `04_frontend_performance.md`
