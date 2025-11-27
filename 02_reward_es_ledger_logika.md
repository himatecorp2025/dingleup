# 02. Reward és Ledger Logika Audit

**Dátum**: 2025-01-27  
**Fázis**: Phase A – Critical  
**Prioritás**: P0 (KRITIKUS)

---

## 1. Áttekintés

A DingleUP! reward rendszere 3 fő ledger táblát használ:
1. **wallet_ledger** (coins és lives változások)
2. **lives_ledger** (DEPRECATED? régi lives tracking)
3. **booster_purchases** (booster vásárlás history)

Ezenkívül 2 PostgreSQL function végzi a jóváírást:
- `credit_wallet(user_id, delta_coins, delta_lives, source, idempotency_key, metadata)`
- `credit_lives(user_id, delta_lives, source, idempotency_key, metadata)` (DEPRECATED?)

---

## 2. Wallet Ledger Architektúra

### 2.1. wallet_ledger Tábla Szerkezete

```sql
CREATE TABLE wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  delta_coins INTEGER DEFAULT 0,
  delta_lives INTEGER DEFAULT 0,
  source TEXT NOT NULL, -- 'game_start', 'gameplay_reward', 'daily_gift', 'purchase', 'admin_credit', stb.
  idempotency_key TEXT UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX wallet_ledger_idempotency_key_unique ON wallet_ledger(idempotency_key);
```

**✅ POZITÍVUMOK:**
- UNIQUE constraint az idempotency_key-n → dupla jóváírás lehetetlen
- Minden változás auditálható (source, metadata)
- Delta alapú (+/- értékek) → könnyű rollback

**⚠️ HIÁNYOSSÁGOK:**

1. **❌ Nincs balance snapshot**
   - A táblában csak delta-k vannak, nincs "balance_after" mező
   - Ha a profiles.coins és a ledger összegei nem egyeznek → hard to debug
   - **FIX**: Új mező: `balance_after JSONB` (coins_after, lives_after snapshot)

2. **❌ Nincs reversal/rollback flag**
   - Ha egy jóváírást vissza kell vonni (fraud, admin correction), nincs explicit mechanizmus
   - **FIX**: Új mező: `reversal_of UUID REFERENCES wallet_ledger(id)`, így visszakereshető a rollback chain

---

### 2.2. credit_wallet() PostgreSQL Function

```sql
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_delta_coins INTEGER,
  p_delta_lives INTEGER,
  p_source TEXT,
  p_idempotency_key TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  v_current_coins INTEGER;
  v_current_lives INTEGER;
  v_new_coins INTEGER;
  v_new_lives INTEGER;
BEGIN
  -- Idempotency check
  IF EXISTS (SELECT 1 FROM wallet_ledger WHERE idempotency_key = p_idempotency_key) THEN
    RETURN jsonb_build_object('success', true, 'already_processed', true);
  END IF;

  -- Lock user profile
  SELECT coins, lives INTO v_current_coins, v_current_lives
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Calculate new values
  v_new_coins := v_current_coins + p_delta_coins;
  v_new_lives := v_current_lives + p_delta_lives;

  -- Negative balance check
  IF v_new_coins < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
  END IF;

  IF v_new_lives < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient lives');
  END IF;

  -- Insert ledger entry
  INSERT INTO wallet_ledger (user_id, delta_coins, delta_lives, source, idempotency_key, metadata)
  VALUES (p_user_id, p_delta_coins, p_delta_lives, p_source, p_idempotency_key, p_metadata);

  -- Update profile
  UPDATE profiles
  SET coins = v_new_coins,
      lives = v_new_lives,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_coins', v_new_coins,
    'new_lives', v_new_lives
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**✅ POZITÍVUMOK:**
- FOR UPDATE lock → race condition védelem
- Idempotency check
- Negative balance check
- Atomi tranzakció (INSERT + UPDATE egy functionben)

**⚠️ HIÁNYOSSÁGOK:**

1. **❌ Nincs max_lives overflow check**
   - Ha user 15/15 élettel van, és kap +20 életet → 35/15 lesz
   - Ez lehet szándékos ("bonus lives"), de nincs dokumentálva
   - **FIX**: Explicit policy: `IF v_new_lives > max_lives THEN ... (cap OR allow bonus)`

2. **❌ Nincs balance_after snapshot**
   - A function visszatér new_coins/new_lives-szal, de ez nincs benne a wallet_ledger-ben
   - **FIX**: wallet_ledger.metadata-ba írjuk bele: `{"coins_before": X, "coins_after": Y, "lives_before": Z, "lives_after": W}`

---

## 3. Reward Jóváírási Pontok Audit

### 3.1. credit-gameplay-reward Edge Function

**Trigger**: Minden helyes válasz után (játék közben)

**Flow**:
```typescript
// supabase/functions/credit-gameplay-reward/index.ts
const { session_id, question_index, coins_earned } = await req.json();

const idempotencyKey = `gameplay:${session_id}:q${question_index}`;

// Call credit_wallet()
const { data, error } = await supabase.rpc('credit_wallet', {
  p_user_id: user.id,
  p_delta_coins: coins_earned,
  p_delta_lives: 0,
  p_source: 'gameplay_reward',
  p_idempotency_key: idempotencyKey,
  p_metadata: { session_id, question_index }
});
```

**✅ POZITÍVUMOK:**
- Idempotency kulcs: session + question_index → dupla credit lehetetlen
- Backend validation (authentikált user)

**⚠️ HIÁNYOSSÁGOK:**

1. **❌ Nincs question validation**
   - Frontend küldi a `coins_earned` értéket → manipulálható
   - **FIX**: Backend kiszámítja coins_earned-t `getCoinsForQuestion(question_index)` alapján

2. **❌ Session validity check hiányzik**
   - Frontend küldhet expired vagy fake session_id-t
   - **FIX**: Check `game_sessions` táblában, hogy a session aktív és nem lejárt

---

### 3.2. credit-like-popup-reward Edge Function

**Trigger**: Ha user lájkol egy kérdést (első alkalommal)

**Flow**:
```typescript
const idempotencyKey = `like_popup_reward:${user.id}:${question_id}`;

await supabase.rpc('credit_wallet', {
  p_user_id: user.id,
  p_delta_coins: 10, // ← Hardcoded reward
  p_delta_lives: 0,
  p_source: 'like_popup_reward',
  p_idempotency_key: idempotencyKey,
  p_metadata: { question_id }
});
```

**✅ POZITÍVUMOK:**
- Idempotency védelem

**⚠️ HIÁNYOSSÁGOK:**

1. **❌ Reward érték hardcoded**
   - Ha változtatni akarunk 10 coin-ról 20-ra, manuális kód módosítás kell
   - **FIX**: reward_config tábla vagy env variable: `LIKE_POPUP_REWARD_COINS`

2. **❌ Rate limiting hiányzik**
   - User spamelheti a like gombot, ha a frontend rate limit megkerülhető
   - **FIX**: Backend check: max 1 like per question per user (unique constraint: `question_likes(user_id, question_id)`)

---

### 3.3. claim-daily-rank-reward Edge Function

**Trigger**: Napi ranglista jutalom igénylése (TOP 10)

**Flow**:
```typescript
// Check: daily_winner_awarded táblában van-e pending reward
const { data: reward } = await supabase
  .from('daily_winner_awarded')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'pending')
  .single();

if (!reward) {
  return { error: 'No pending reward' };
}

const idempotencyKey = `daily_rank_reward:${reward.id}`;

await supabase.rpc('credit_wallet', {
  p_user_id: user.id,
  p_delta_coins: reward.gold_awarded,
  p_delta_lives: reward.lives_awarded,
  p_source: 'daily_rank_reward',
  p_idempotency_key: idempotencyKey,
  p_metadata: { reward_id: reward.id, rank: reward.rank }
});

// Mark as claimed
await supabase
  .from('daily_winner_awarded')
  .update({ status: 'claimed', claimed_at: new Date().toISOString() })
  .eq('id', reward.id);
```

**✅ POZITÍVUMOK:**
- Kétszeres jóváírás elleni védelem: idempotency + status change
- Audit trail (daily_winner_awarded.claimed_at)

**⚠️ HIÁNYOSSÁGOK:**

1. **❌ Status update és credit_wallet() nem egy tranzakcióban**
   - Ha a credit_wallet() sikeres, de az UPDATE fail → reward újra claimelhető
   - **FIX**: PostgreSQL function, amely egyben végzi mindkettőt

2. **❌ Dismissed reward nem handled**
   - Ha user dismiss-eli a popup (nem claim-eli), a status megmarad 'pending'
   - 1 nap múlva már nem claimelhető, de nincs automatic expiry
   - **FIX**: Cron job: `UPDATE daily_winner_awarded SET status = 'expired' WHERE status = 'pending' AND day_date < CURRENT_DATE - 1`

---

### 3.4. Daily Gift (claim_daily_gift PostgreSQL function)

**Trigger**: User manuálisan claim-eli a napi ajándékot (Dashboard)

**Flow**:
```sql
CREATE OR REPLACE FUNCTION claim_daily_gift() RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_current_streak INTEGER;
  v_reward_coins INTEGER;
  v_today TEXT := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_idempotency_key TEXT := 'daily-gift:' || v_user_id || ':' || v_today;
BEGIN
  -- Idempotency check
  IF EXISTS (SELECT 1 FROM wallet_ledger WHERE idempotency_key = v_idempotency_key) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED_TODAY');
  END IF;

  -- Calculate streak
  SELECT daily_gift_streak INTO v_current_streak FROM profiles WHERE id = v_user_id;
  v_current_streak := COALESCE(v_current_streak, 0) + 1;

  -- 7-day cycle reward
  v_reward_coins := CASE (v_current_streak - 1) % 7
    WHEN 0 THEN 50
    WHEN 1 THEN 75
    WHEN 2 THEN 110
    WHEN 3 THEN 160
    WHEN 4 THEN 220
    WHEN 5 THEN 300
    WHEN 6 THEN 500
  END;

  -- Credit via wallet_ledger
  INSERT INTO wallet_ledger (user_id, delta_coins, delta_lives, source, idempotency_key, metadata)
  VALUES (v_user_id, v_reward_coins, 0, 'daily', v_idempotency_key, jsonb_build_object('streak', v_current_streak, 'date', v_today));

  -- Update profile
  UPDATE profiles
  SET coins = coins + v_reward_coins,
      daily_gift_streak = v_current_streak,
      daily_gift_last_claimed = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'grantedCoins', v_reward_coins, 'streak', v_current_streak);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**✅ POZITÍVUMOK:**
- Idempotency védelem (day-based key)
- Atomi tranzakció (INSERT + UPDATE)
- Streak calculation

**⚠️ HIÁNYOSSÁGOK:**

1. **❌ Timezone edge case**
   - Ha user UTC éjfél után, de helyi idő szerint még aznap claimel → streak elveszik?
   - Jelenlegi logika: UTC-based
   - **FIX**: user_timezone alapú calculation (már létezik profiles.user_timezone)

2. **❌ 24h throttle check hiányzik**
   - A function ellenőrzi, hogy today date már van-e ledger-ben, de nem nézi a last_claimed timestamp-et
   - Ha user 23:59-kor claim, majd 00:01-kor újra → mindkettő mehet
   - **FIX**: Explicit `IF NOW() - daily_gift_last_claimed < INTERVAL '24 hours' THEN RETURN error`

---

## 4. Lives Ledger Audit (DEPRECATED?)

### 4.1. lives_ledger Tábla

```sql
CREATE TABLE lives_ledger (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  delta_lives INTEGER NOT NULL,
  source TEXT NOT NULL,
  correlation_id TEXT UNIQUE NOT NULL, -- idempotency key
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**⚠️ MEGÁLLAPÍTÁS**: Ez a tábla **REDUNDÁNS** a wallet_ledger mellett!

**DÖNTÉS SZÜKSÉGES**:
1. Ha lives_ledger továbbra is használatos → **merge** wallet_ledger-be (wallet_ledger.delta_lives elég)
2. Ha már nem használatos → **DELETE** lives_ledger tábla + credit_lives() function

**JELENLEGI HASZNÁLAT AUDIT**:
- `use_life()` function: wallet_ledger-be ír (nem lives_ledger-be)
- `regenerate_lives()` function: közvetlenül profiles.lives-t módosítja (nincs ledger entry!)

**⚠️ KRITIKUS HIÁNYOSSÁG**: Life regeneration nincs auditálva!

**FIX**:
```sql
CREATE OR REPLACE FUNCTION regenerate_lives_background() ... BEGIN
  ...
  IF v_lives_to_add > 0 THEN
    -- Új ledger entry
    INSERT INTO wallet_ledger (user_id, delta_coins, delta_lives, source, idempotency_key, metadata)
    VALUES (
      profile_rec.id,
      0,
      v_lives_to_add,
      'life_regeneration',
      'regen:' || profile_rec.id || ':' || NOW()::TEXT,
      jsonb_build_object('minutes_passed', v_minutes_passed)
    );
    
    -- Update profile
    UPDATE profiles SET lives = ... WHERE id = profile_rec.id;
  END IF;
END;
```

---

## 5. Booster Purchases Audit

### 5.1. booster_purchases Tábla

```sql
CREATE TABLE booster_purchases (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  booster_type_id UUID NOT NULL REFERENCES booster_types(id),
  purchase_source TEXT NOT NULL, -- 'gold' OR 'usd'
  gold_spent INTEGER DEFAULT 0,
  usd_cents_spent INTEGER DEFAULT 0,
  iap_transaction_id TEXT, -- Stripe session_id
  purchase_context TEXT, -- 'dashboard', 'in_game_rescue', stb.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**✅ POZITÍVUMOK:**
- Separate audit table (nem wallet_ledger-ben)
- IAP transaction ID tárolása

**⚠️ HIÁNYOSSÁGOK:**

1. **❌ Nincs idempotency védelem**
   - Ha user dupla kattintással vásárol → 2 rekord
   - **FIX**: UNIQUE constraint `(user_id, iap_transaction_id)` ahol iap_transaction_id NOT NULL

2. **❌ Gold_spent dedukció nincs wallet_ledger-ben**
   - Ha user 150 goldért vásárol boostert, a gold_spent csak a booster_purchases táblában jelenik meg
   - A wallet_ledger-ben nincs `-150 gold` entry
   - **FIX**: purchase-booster edge function hívja credit_wallet()-t `-gold_spent` értékkel

---

## 6. Rollback és Fraud Detection

### 6.1. Jelenlegi Rollback Mechanizmus

**⚠️ NEM LÉTEZIK**

**SZÜKSÉGES**:
1. Admin UI: "Reverse Transaction" gomb
2. Edge function: `admin-reverse-transaction`
   - Input: wallet_ledger.id
   - Action:
     - Insert új wallet_ledger entry: delta_coins = -original_delta_coins, source = 'admin_reversal', reversal_of = original_id
     - Update profiles: coins -= original_delta_coins
     - Admin audit log

### 6.2. Fraud Detection

**JELENLEGI**: ❌ Nincs automatikus fraud detection

**JAVASOLT**:
- **Abnormal velocity**: ha user 10 percen belül 100+ coin-t keres → flag
- **Multiple payment sources**: ha user 1 órán belül 5+ különböző payment method-dal fizet → review
- **Chargeback monitoring**: Stripe webhook: `charge.refunded` → automatic reversal

---

## 7. Reward Timing – Frontend Optimista Jóváírás

### 7.1. Követelmény

**CRITICAL**: Frontend **NEM** jeleníthet meg reward-ot, amíg backend nem confirmálta

**AUDIT**:

#### GamePreview.tsx
```typescript
const handleCorrectAnswer = async () => {
  // ❌ VESZÉLYES: Optimista coin update ELŐTT backend hívás
  setCoinBalance(prev => prev + coinsEarned); // ← NE!
  
  // ✅ HELYES: Csak backend response után
  const { data } = await supabase.functions.invoke('credit-gameplay-reward', {
    body: { session_id, question_index, coins_earned: coinsEarned }
  });
  
  if (data?.success) {
    setCoinBalance(data.new_coins); // ← Backend által confirmált érték
  }
};
```

**JELENLEGI KÓD AUDIT**: ✅ Helyes, nincs optimista frissítés

---

## 8. Admin Manuális Credit és Abuse Prevention

### 8.1. Admin Credit UI

**JELENLEGI**: ❌ Nincs implementálva

**SZÜKSÉGES**:
- Admin oldal: AdminGameProfileDetail → "Manual Credit" section
- Input mezők: `delta_coins`, `delta_lives`, `reason`
- Edge function: `admin-manual-credit`

```typescript
// supabase/functions/admin-manual-credit/index.ts
const { target_user_id, delta_coins, delta_lives, reason } = await req.json();

// Role check
const isAdmin = await checkAdminRole(user.id);
if (!isAdmin) return Response(403);

// Rate limit: max 10 manual credit / hour / admin
const recentCredits = await supabase
  .from('wallet_ledger')
  .select('id')
  .eq('source', 'admin_manual_credit')
  .eq('metadata->>admin_user_id', user.id)
  .gte('created_at', new Date(Date.now() - 3600000).toISOString());

if (recentCredits.data.length >= 10) {
  return Response(429, 'Rate limit exceeded');
}

// Credit
const idempotencyKey = `admin_credit:${target_user_id}:${Date.now()}:${user.id}`;

await supabase.rpc('credit_wallet', {
  p_user_id: target_user_id,
  p_delta_coins: delta_coins,
  p_delta_lives: delta_lives,
  p_source: 'admin_manual_credit',
  p_idempotency_key: idempotencyKey,
  p_metadata: {
    admin_user_id: user.id,
    reason: reason
  }
});

// Admin audit log
await supabase.from('admin_audit_log').insert({
  admin_user_id: user.id,
  action: 'manual_credit',
  resource_type: 'wallet',
  resource_id: target_user_id,
  new_value: { delta_coins, delta_lives, reason }
});
```

---

## 9. Összefoglaló – Kritikus Javítások

### P0 (AZONNAL):
1. ✅ **Question validation** (credit-gameplay-reward: backend validate coins_earned)
2. ✅ **Session validity check** (game_sessions táblában active check)
3. ✅ **Balance snapshot** (wallet_ledger.metadata: coins_before/after)
4. ✅ **Lives regeneration audit** (wallet_ledger entry minden regeneration-nél)

### P1 (Sürgős):
5. ✅ **Gold purchase dedukció** (booster purchase → wallet_ledger entry)
6. ✅ **Daily gift 24h throttle** (explicit timestamp check)
7. ✅ **Status update + credit tranzakció** (claim-daily-rank-reward atomikusan)
8. ✅ **Admin manual credit UI** + rate limiting

### P2 (Fontos):
9. ✅ **Rollback mechanism** (admin reverse transaction UI)
10. ✅ **Fraud detection** (abnormal velocity, chargeback webhook)

---

**Következő riport**: `03_halott_kod_elemzes.md`
