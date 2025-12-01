# REWARD ECONOMY ALIGNMENT – PHASE 0 DISCOVERY (Read-Only)

## Dátum: 2025-12-01

## Cél
A jelenlegi implementáció teljes feltérképezése és összehasonlítása a `REWARD_ECONOMY_SYSTEM_TECHNICAL_DOCUMENTATION.md` dokumentációval.

---

## 1. DATABASE TÁBLÁK

### ✅ Megtalált táblák:
- `profiles` – Migration: `20251017021046`, `20251022012608`, további módosítások
- `wallet_ledger` – Migration: `20251022012608`
- `wallet_ledger_archive` – Migration: `20251201120609`
- `lives_ledger` – Migration: `20251023122518`
- `lives_ledger_archive` – Migration: `20251201120609`
- `speed_tokens` – Migration: `20251119132103`
- `lootbox_instances` – Migration: `20251127144609`
- `booster_types` – Migration: `20251119122809`
- `booster_purchases` – Migration: `20251119122809`
- `welcome_bonus_attempts` – Migration: `20251025094103`

### 📋 Ellenőrizendő (Phase 1):
- [ ] `profiles` séma összevetése dokumentációval (összes reward-related mező)
- [ ] `wallet_ledger` source CHECK constraint összevetése
- [ ] `lives_ledger` redundancia dokumentálása
- [ ] `speed_tokens` schema
- [ ] `lootbox_instances` status/source CHECK constraints
- [ ] `booster_types` 4 booster kód létezése (FREE, PREMIUM, GOLD_SAVER, INSTANT_RESCUE)
- [ ] Indexek létezése és megfelelősége
- [ ] RLS policies teljes auditja

---

## 2. RPC FUNCTIONS

### ✅ Megtalált RPC-k:
- `credit_wallet` – Migration: `20251022012608`, later: `20251127022814` (FOR UPDATE lock fix)
- `credit_lives` – Migration: `20251023122518`
- `use_life` – Migration: `20251018042337` és későbbi verziók
- `regenerate_lives_background` – Migration: `20251022125433`, `20251022125624`
- `claim_daily_gift` – Migration: `20251018044114`, later: `20251119003132` (timezone-aware)
- `claim_welcome_bonus` – Migration: `20251018044114`
- `open_lootbox_transaction` – Migration: (részben summary-ban látható)
- `create_lootbox_drop` – Migration: (részben látható)
- `upsert_daily_ranking_aggregate` – Használva `complete-game`-ben

### 📋 Ellenőrizendő (Phase 2):
- [ ] `credit_wallet` idempotencia logika pontos működése
- [ ] `credit_wallet` negative balance check
- [ ] `use_life` future timestamp guard implementációja
- [ ] `use_life` bonus life preservation (>max_lives)
- [ ] `regenerate_lives_background` speed booster handling
- [ ] `claim_daily_gift` timezone-aware logic + idempotency
- [ ] `claim_daily_gift` streak reset (DOK szerint NINCS IMPLEMENTÁLVA – ezt NEM kell hozzáadni)
- [ ] `claim_welcome_bonus` rate limiting + idempotency

---

## 3. EDGE FUNCTIONS

### ✅ Megtalált Edge Functions:

**Wallet & Lives:**
- `get-wallet` – Wallet state lekérés + inline regeneration
- `credit-gameplay-reward` – Per-question reward crediting

**Game Flow:**
- `start-game-session` – Session creation + pool rotation (life deduction NINCS benne, frontend hívja use_life-ot)
- `complete-game` – Game stats recording (NEM creditál coinokat, csak statisztika)

**Lootbox System:**
- `lootbox-active` – Active lootbox query
- `lootbox-decide` – Open/store decision
- `lootbox-open-stored` – Stored lootbox opening
- `lootbox-heartbeat` – Activity tracking
- `lootbox-stored` – Stored boxes query
- `register-activity-and-drop` – Activity logging + drop triggering

**Daily Gift:**
- `get-daily-gift-status` – Status check (timezone-aware)
- `dismiss-daily-gift` – Later button handler
- (claim via RPC: `claim_daily_gift`)

**Booster System:**
- `purchase-booster` – Booster purchase handling
- `activate-speed-token` – Speed token activation
- `activate-premium-speed` – Premium speed activation

**Payment Verification:**
- `verify-lootbox-payment` – Stripe lootbox payment verification
- `verify-speed-boost-payment` – Stripe speed boost verification
- `verify-premium-booster-payment` – Stripe premium booster verification
- `verify-instant-rescue-payment` – Stripe instant rescue verification

### 📋 Ellenőrizendő (Phase 3):
- [ ] `get-wallet` inline regeneration logika vs dokumentáció
- [ ] `get-wallet` future timestamp guard
- [ ] `credit-gameplay-reward` idempotency + rate limiting
- [ ] `complete-game` NEM creditál coinokat (csak statisztika) – CORRECT per doc
- [ ] `lootbox-decide` tier-based reward generation
- [ ] `lootbox-open-stored` purchase vs drop cost logic (0 vs 150 gold)
- [ ] `purchase-booster` FREE/GOLD_SAVER logic + PREMIUM/INSTANT_RESCUE Stripe-only
- [ ] `register-activity-and-drop` daily limit (20), cooldown (5 min), first 3 guaranteed

---

## 4. FRONTEND HOOKS

### ✅ Megtalált hooks:
- `useWallet` – `src/hooks/useWallet.ts` + `src/stores/walletStore.ts` (Zustand)
- `useDailyGift` – `src/hooks/useDailyGift.ts`
- `useWelcomeBonus` – `src/hooks/useWelcomeBonus.ts`
- `useActiveLootbox` – `src/hooks/useActiveLootbox.ts`
- `useLootboxActivityTracker` – `src/hooks/useLootboxActivityTracker.ts`
- `useLoginLootboxTracker` – `src/hooks/useLoginLootboxTracker.ts`
- `useBoosterState` – `src/hooks/useBoosterState.ts`
- `useDailyRankReward` – `src/hooks/useDailyRankReward.ts` (rank reward hook)

### 📋 Ellenőrizendő (Phase 4):
- [ ] `useWallet` field filtering használata (payload optimization)
- [ ] `useWallet` real-time frissítés + BroadcastChannel
- [ ] `useDailyGift` timezone-aware status check
- [ ] `useDailyGift` streak display
- [ ] `useWelcomeBonus` Later gomb behavior (marks as claimed)
- [ ] Lootbox hooks NOT_ENOUGH_GOLD error handling
- [ ] `useBoosterState` speed token pending/active kezelése

---

## 5. UI KOMPONENSEK

### ✅ Megtalált komponensek:
- `WelcomeBonusDialog` – `src/components/WelcomeBonusDialog.tsx`
- `DailyGiftDialog` – `src/components/DailyGiftDialog.tsx`
- `LootboxDropOverlay` – `src/components/lootbox/LootboxDropOverlay.tsx`
- `LootboxDecisionDialog` – `src/components/lootbox/LootboxDecisionDialog.tsx`
- `ActiveLootboxDisplay` – `src/components/lootbox/ActiveLootboxDisplay.tsx`
- `BoosterButton` – `src/components/BoosterButton.tsx`
- `NextLifeTimer` – `src/components/NextLifeTimer.tsx`
- `CoinRewardAnimation` – `src/components/CoinRewardAnimation.tsx`

### 📋 Ellenőrizendő (Phase 4):
- [ ] DailyGiftDialog popup sequence gate (Welcome → Daily)
- [ ] WelcomeBonusDialog Later button (permanent loss)
- [ ] LootboxDecisionDialog 150 gold cost display
- [ ] LootboxDecisionDialog wallet balance check

---

## 6. ALGINMENT STATUS – QUICK SCAN

### ✅ MÁR ALIGNED (valószínűleg):
1. **`complete-game` NEM creditál coinokat** – Csak statisztikát rögzít ✅
2. **`credit-gameplay-reward` per-question reward** – Idempotens, rate limited ✅
3. **`wallet_ledger` idempotency_key UNIQUE** – Létezik ✅
4. **Archíválás** – `wallet_ledger_archive` + `archive_old_wallet_ledger()` ✅
5. **Speed token handling** – `speed_tokens` tábla + `active_speed_expires_at` denormalization ✅
6. **Timezone-aware daily gift** – `claim_daily_gift()` RPC uses `user_timezone` ✅
7. **Daily gift streak cycle** – Day 0-6 rewards (50-500 gold) ✅
8. **Lootbox tier-based rewards** – A-F tiers with probabilities ✅
9. **Booster types** – FREE, PREMIUM, GOLD_SAVER, INSTANT_RESCUE léteznek ✅

### ⚠️ DIVERGENCIÁK / ELLENŐRIZENDŐ:

#### Database Layer:
- [ ] **profiles indexek** – `idx_profiles_lives_regen`, `idx_profiles_speed_expires`, `idx_profiles_username_lower` léteznek?
- [ ] **wallet_ledger indexek** – `idx_wallet_ledger_user_created`, `idx_wallet_ledger_idempotency`, `idx_wallet_ledger_source` léteznek?
- [ ] **wallet_ledger source CHECK constraint** – Tartalmazza az összes dokumentált source értéket?
- [ ] **RLS policies** – Minden tábla RLS-e teljes?

#### RPC Functions:
- [ ] **`credit_wallet` return type** – JSON vs JSONB konzisztencia
- [ ] **`use_life` future timestamp guard** – Implementálva van-e a `IF last_life_regeneration > NOW()` normalizáció?
- [ ] **`use_life` bonus life preservation** – Ha `lives > max_lives` → NEM regenerál tovább?
- [ ] **`regenerate_lives_background` optimization** – Denormalizált `active_speed_expires_at` használata (NO subquery)
- [ ] **`claim_daily_gift` return type** – JSONB vs JSON
- [ ] **`claim_welcome_bonus` ledger logging** – Használja `credit_wallet` + `credit_lives` RPC-t vagy direkt INSERT-et?

#### Edge Functions:
- [ ] **`get-wallet` inline regeneration concurrency** – Dokumentált kockázat: concurrent calls → duplicate regen
- [ ] **`get-wallet` field filtering** – Implementálva van-e a payload optimization?
- [ ] **`start-game-session` life deduction** – NINCS benne (frontend hívja use_life-ot) ✅ per doc
- [ ] **`lootbox-open-stored` purchase vs drop cost** – 0 gold ha purchase source, 150 ha drop source
- [ ] **`purchase-booster` PREMIUM/INSTANT_RESCUE** – Stripe-only (nincs simulated payment)
- [ ] **`register-activity-and-drop` daily limits** – 20 max, first 3 guaranteed, 5 min cooldown

#### Frontend:
- [ ] **useWallet field filtering** – Használja-e a `?fields=...` param-ot?
- [ ] **useDailyGift popup sequence** – Welcome Bonus után jelenik meg?
- [ ] **useWelcomeBonus Later behavior** – Permanent loss (marks as claimed)?

---

## 7. KONKRÉT FÁJLOK LISTÁJA

### Database Migrations (reward-related):
- `supabase/migrations/20251017021046_*.sql` – profiles tábla
- `supabase/migrations/20251022012608_*.sql` – wallet_ledger + credit_wallet
- `supabase/migrations/20251023122518_*.sql` – lives_ledger + credit_lives
- `supabase/migrations/20251025094103_*.sql` – welcome_bonus_attempts
- `supabase/migrations/20251119122809_*.sql` – booster_types + booster_purchases
- `supabase/migrations/20251119132103_*.sql` – speed_tokens
- `supabase/migrations/20251127022814_*.sql` – credit_wallet FOR UPDATE lock
- `supabase/migrations/20251127144609_*.sql` – lootbox_instances
- `supabase/migrations/20251201120609_*.sql` – wallet_ledger_archive + lives_ledger_archive

### Edge Functions:
- `supabase/functions/get-wallet/index.ts`
- `supabase/functions/start-game-session/index.ts`
- `supabase/functions/credit-gameplay-reward/index.ts`
- `supabase/functions/complete-game/index.ts`
- `supabase/functions/claim-daily-rank-reward/index.ts`
- `supabase/functions/get-daily-gift-status/index.ts`
- `supabase/functions/dismiss-daily-gift/index.ts`
- `supabase/functions/lootbox-decide/index.ts`
- `supabase/functions/lootbox-open-stored/index.ts`
- `supabase/functions/lootbox-active/index.ts`
- `supabase/functions/lootbox-stored/index.ts`
- `supabase/functions/lootbox-heartbeat/index.ts`
- `supabase/functions/register-activity-and-drop/index.ts`
- `supabase/functions/purchase-booster/index.ts`
- `supabase/functions/activate-speed-token/index.ts`
- `supabase/functions/activate-premium-speed/index.ts`
- `supabase/functions/verify-lootbox-payment/index.ts`
- `supabase/functions/verify-speed-boost-payment/index.ts`
- `supabase/functions/verify-premium-booster-payment/index.ts`
- `supabase/functions/verify-instant-rescue-payment/index.ts`
- `supabase/functions/_shared/lootboxRewards.ts` – Tier-based reward generation

### Frontend Hooks:
- `src/hooks/useWallet.ts`
- `src/stores/walletStore.ts` (Zustand store)
- `src/hooks/useDailyGift.ts`
- `src/hooks/useWelcomeBonus.ts`
- `src/hooks/useDailyRankReward.ts`
- `src/hooks/useActiveLootbox.ts`
- `src/hooks/useLootboxActivityTracker.ts`
- `src/hooks/useLoginLootboxTracker.ts`
- `src/hooks/useBoosterState.ts`
- `src/hooks/queries/useWalletQuery.ts` (deprecated in favor of walletStore?)

### Frontend Components:
- `src/components/WelcomeBonusDialog.tsx`
- `src/components/DailyGiftDialog.tsx`
- `src/components/NextLifeTimer.tsx`
- `src/components/CoinRewardAnimation.tsx`
- `src/components/BoosterButton.tsx`
- `src/components/lootbox/LootboxDropOverlay.tsx`
- `src/components/lootbox/LootboxDecisionDialog.tsx`
- `src/components/lootbox/ActiveLootboxDisplay.tsx`
- `src/components/lootbox/GoldLootboxIcon.tsx`
- `src/components/lootbox/LootboxCountdownTimer.tsx`
- `src/components/lootbox/LootboxIncomingNotification.tsx`
- `src/components/game/GameRewardSystem.tsx`

---

## 8. IMMEDIATE DIVERGENCIÁK AZONOSÍTVA

### 1. **`use_life()` future timestamp guard**
**Dokumentáció szerint:**
```sql
IF last_life_regeneration > NOW() THEN
  last_life_regeneration := NOW();
  -- Update profile
END IF;
```
**Ellenőrizendő:** Migration fájlokban ezt látni kell.

### 2. **`credit_wallet` return type**
**Dokumentáció szerint:** RETURNS JSONB
**Migrationben látható:** RETURNS JSON
**Action:** Ellenőrizni és egységesíteni.

### 3. **`claim_daily_gift` return type**
**Dokumentáció szerint:** RETURNS JSONB
**Migrationben látható:** Különböző verziók (JSON vs JSONB)
**Action:** Ellenőrizni latest verziót.

### 4. **`get-wallet` field filtering**
**Dokumentáció szerint:** Query param `?fields=...` csökkenti payload-ot 30-40%-kal
**Kódban látható:** `get-wallet/index.ts` implementálja! ✅

### 5. **`lootbox-open-stored` purchase source = 0 cost**
**Dokumentáció szerint:** Ha `source === 'purchase'` → 0 gold cost
**Kódban látható:** Nincs itt a context, ellenőrizni kell.

### 6. **`purchase-booster` simulated payment REMOVAL**
**Dokumentáció szerint:** PREMIUM és INSTANT_RESCUE CSAK Stripe, nincs simulation
**Kódban:** Ellenőrizni kell hogy tényleg nincs-e fake/simulated payment.

---

## 9. KÖVETKEZŐ PHASE ACTION ITEMS

### PHASE 1 (Database):
1. Ellenőrizni minden index létezését
2. Ellenőrizni RLS policies teljességét
3. Ellenőrizni source/status CHECK constraints
4. NEM kell módosítani sémákat (már megvannak)

### PHASE 2 (RPC):
1. `credit_wallet` return type JSONB-re (ha szükséges)
2. `use_life` future timestamp guard ellenőrzése
3. `claim_daily_gift` return type JSONB-re
4. `claim_welcome_bonus` idempotency ellenőrzése

### PHASE 3 (Edge Functions):
1. `get-wallet` concurrent regen risk dokumentálása (TODO komment)
2. `lootbox-open-stored` purchase source = 0 cost ellenőrzése
3. `purchase-booster` PREMIUM/INSTANT_RESCUE Stripe-only enforcement

### PHASE 4 (Frontend):
1. `useWallet` field filtering usage ellenőrzése
2. Popup sequence gates ellenőrzése
3. Error handling alignment

### PHASE 5 (Safety):
1. TODO kommentek hozzáadása:
   - lives_ledger redundancy
   - get-wallet concurrent race
   - lootbox/speed_tokens cleanup jobs
   - daily gift streak reset (NOT IMPLEMENTED by design)

---

**PHASE 0 DISCOVERY COMPLETE.**
**Ready for Phase 1.**
