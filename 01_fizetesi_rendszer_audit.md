# 01. Fizetési Rendszer Audit

**Dátum**: 2025-01-27  
**Fázis**: Phase A – Critical  
**Prioritás**: P0 (KRITIKUS)

---

## 1. Áttekintés

A DingleUP! alkalmazás 4 fő fizetési ponttal rendelkezik:
1. **Lootbox vásárlás** (Gifts oldal, 1/3/5/10 doboz csomag)
2. **Speed Booster vásárlás** (Dashboard/játékon belül)
3. **Premium Booster vásárlás** (Dashboard/játékon belül)
4. **In-Game Rescue Popup** (játék közben életek/arany vásárlás)

Minden fizetés **Stripe Checkout Session** alapú, backend verification után történik reward jóváírás.

---

## 2. Fizetési Flow Audit (Végigjárás)

### 2.1. Lootbox Purchase Flow

**UI → Backend → Stripe → Verify → Ledger → Reward → UI**

```
[Gifts oldal]
  ↓
[Megszerzem gomb kattintás]
  ↓
[create-lootbox-payment edge function]
  - Stripe Checkout Session létrehozása
  - mode: "payment"
  - line_items: lootbox csomag (1/3/5/10 db)
  - success_url: /payment-success?session_id={CHECKOUT_SESSION_ID}
  - cancel_url: /gifts
  ↓
[User átirányítva Stripe-ra]
  - Felhasználó befejezi a fizetést
  ↓
[Stripe redirect → /payment-success?session_id=...]
  ↓
[PaymentSuccess komponens]
  - useEffect: verifyPayment() hívás
  - prefetchDashboardData() (optimalizálás)
  ↓
[verify-lootbox-payment edge function]
  - Stripe session.retrieve(session_id)
  - payment_status === 'paid' ellenőrzés
  - lootbox_instances táblába INSERT (idempotency_key használatával)
  - source='purchase', status='stored'
  ↓
[Reward megjelenik Gifts oldalon]
  - User visszairányítva Dashboard-ra
  - Toast: "Sikeres vásárlás"
```

**✅ POZITÍVUMOK:**
- Idempotency kulcs használata (`session_id`) a verify functionben → dupla jóváírás elleni védelem
- Backend verification UTÁN történik reward jóváírás (NOT before)
- Stripe session status explicit ellenőrzés (`payment_status === 'paid'`)

**⚠️ KRITIKUS HIBÁK:**

1. **❌ NINCS webhook backup verification**
   - Ha a user bezárja a tabot a Stripe oldalon fizetés után, de a success_url redirect nem történik meg → reward elvész
   - **FIX**: Stripe webhook (`checkout.session.completed`) implementálása kötelező

2. **❌ Session ID manipuláció lehetséges**
   - A `?session_id=...` query param nincs aláírva/titkosítva
   - Támadó próbálkozhat régi vagy mások session ID-jével
   - **FIX**: Backend ellenőrizze, hogy a session customer email/ID egyezik-e az authentikált userrel

3. **❌ Timeout és network error nincs kezelve**
   - Ha a verify API 30+ másodpercig nem válaszol, a user error nélkül marad
   - **FIX**: Frontend timeout + retry logika, explicit error UI

4. **⚠️ Mobile WebView edge case**
   - iOS Safari/WebView-ban a Stripe popup bezárása után nem mindig redirect vissza
   - **FIX**: Deep link fallback + polling-based verification (ha redirect failed)

---

### 2.2. Speed Booster Purchase Flow

**UI → Backend → Stripe → Verify → Ledger → Reward → UI**

```
[Dashboard/Game]
  ↓
[Speed Token vásárlás gomb]
  ↓
[create-speed-boost-payment edge function]
  - Stripe Checkout Session
  - mode: "payment"
  - line_items: speed token price
  - success_url: /payment-success?session_id={CHECKOUT_SESSION_ID}
  - cancel_url: /dashboard
  ↓
[Stripe redirect → PaymentSuccess]
  ↓
[verify-speed-boost-payment edge function]
  - session.retrieve(session_id)
  - payment_status === 'paid'
  - speed_tokens táblába INSERT (user_id, expires_at, idempotency_key)
  ↓
[Reward: speed token aktiválható]
```

**✅ POZITÍVUMOK:**
- Idempotency védelem
- Backend verification

**⚠️ KRITIKUS HIBÁK:**

1. **❌ NINCS webhook backup** (ugyanaz mint lootbox)
2. **❌ Expires_at time drift**
   - Ha a verify több percet késik (network lag), a token lejárati ideje túl rövid lehet
   - **FIX**: expires_at = NOW() + duration a VERIFY időpontban, ne a CREATE-nél

3. **❌ Active speed token collision**
   - Ha usernek már van aktív speed tokenje, és újat vásárol, mi történik?
   - Jelenlegi kód: INSERT új token → lehet párhuzamos aktív token?
   - **FIX**: Explicit check: `SELECT COUNT(*) FROM speed_tokens WHERE user_id = ... AND expires_at > NOW()`, ha > 0 → extend duration VAGY error

---

### 2.3. Premium Booster Purchase Flow

**UI → Backend → Stripe → Verify → Ledger → Reward → UI**

```
[In-Game Rescue Popup VAGY Dashboard]
  ↓
[Premium Booster vásárlás]
  ↓
[create-premium-booster-payment edge function]
  - Stripe Checkout Session
  - mode: "payment"
  - line_items: premium booster package
  - success_url: /payment-success?session_id={CHECKOUT_SESSION_ID}
  - cancel_url: /dashboard
  ↓
[Stripe → PaymentSuccess]
  ↓
[verify-premium-booster-payment edge function]
  - session.retrieve(session_id)
  - payment_status === 'paid'
  - wallet_ledger INSERT: delta_coins, delta_lives (idempotency_key = session_id)
  - profiles UPDATE: coins += X, lives += Y
  ↓
[Reward megjelenik wallet-ben]
```

**✅ POZITÍVUMOK:**
- wallet_ledger használat (audit trail)
- Idempotency védelem

**⚠️ KRITIKUS HIBÁK:**

1. **❌ NINCS webhook backup** (ugyanaz)
2. **❌ Race condition a profiles UPDATE-nél**
   - Ha 2 verify hívás párhuzamosan fut (dupla kattintás, retry), mindkettő lefuthat
   - Idempotency kulcs védi a ledger-t, de a profiles UPDATE kétszer is megtörténhet
   - **FIX**: wallet_ledger INSERT + profiles UPDATE legyen **1 tranzakción belül** (PostgreSQL function: credit_wallet)

3. **❌ Lives > max_lives overflow nem védett**
   - Ha user 10/15 élettel van, és vásárol +20 életet → 30/15 lesz
   - Ez lehet feature vagy bug, de nincs dokumentálva
   - **FIX**: Explicit max_lives policy vagy "bonus lives above cap" dokumentáció

---

### 2.4. In-Game Rescue Popup Purchase Flow

**UI → Backend → Stripe → Verify → Ledger → Game Resume**

```
[Játék közben]
  ↓
[Életek vagy arany elfogyott]
  ↓
[InGameRescuePopup megjelenik]
  ↓
[create-instant-rescue-payment edge function]
  - Stripe Checkout Session
  - mode: "payment"
  - metadata: { game_session_id, rescue_type }
  - success_url: /payment-success?session_id={CHECKOUT_SESSION_ID}&game_session={...}
  - cancel_url: /game (vagy /dashboard?)
  ↓
[Stripe → PaymentSuccess]
  ↓
[verify-instant-rescue-payment edge function]
  - session.retrieve(session_id)
  - payment_status === 'paid'
  - Metadata: game_session_id extraction
  - wallet_ledger INSERT: rescue reward
  - profiles UPDATE: lives/coins
  ↓
[??? Game folytatása ???]
```

**⚠️ KRITIKUS HIBÁK:**

1. **❌ NINCS játék state visszaállítás**
   - Ha user befizet, de a játék már le lett zárva (timeout/exit), mi történik?
   - Reward jóváírva, de játék nem folytatható
   - **FIX**: game_sessions táblában "pending_rescue" flag + rescue completion check

2. **❌ Cancel_url rossz navigáció**
   - Ha user Cancel-t nyom Stripe-on, visszamegy /game-re? De a játék már lezárult!
   - **FIX**: cancel_url = /dashboard + explicit "A vásárlás megszakítva" toast

3. **❌ Mobile WebView exit edge case**
   - iOS-en a user kiléphet a Stripe popupból anélkül, hogy Cancel/Success történne
   - Game state limbo → felhasználó nem tudja, mi történt
   - **FIX**: Polling-based rescue verification OR deep link return handling

4. **❌ Dupla rescue kísérlet**
   - User kattint rescue-ra → Stripe redirect
   - User bezárja → újra próbál rescue-t
   - 2 Checkout session párhuzamosan?
   - **FIX**: game_sessions.pending_rescue_session_id tárolása, check before new session

---

## 3. Stripe Webhook Implementáció Hiánya (KRITIKUS)

**JELENLEGI ÁLLAPOT**: ❌ Nincs webhook endpoint

**MIÉRT KRITIKUS**:
- Ha a success_url redirect nem történik meg (tab close, network error, browser crash), a reward elvész
- Stripe a fizetést jóváírta, de az alkalmazás nem tudja → pénz elveszett a usernek

**KÖTELEZŐ FIX**:

Új edge function: `stripe-webhook-handler`

```typescript
// supabase/functions/stripe-webhook-handler/index.ts
import Stripe from "https://esm.sh/stripe@18.5.0";

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }
  
  // checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    const paymentStatus = session.payment_status;
    
    if (paymentStatus !== "paid") {
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }
    
    // Metadata alapján route-olás
    const productType = session.metadata?.product_type; // lootbox, speed, premium, rescue
    
    switch (productType) {
      case "lootbox":
        await handleLootboxWebhook(sessionId, session);
        break;
      case "speed_booster":
        await handleSpeedBoosterWebhook(sessionId, session);
        break;
      case "premium_booster":
        await handlePremiumBoosterWebhook(sessionId, session);
        break;
      case "instant_rescue":
        await handleInstantRescueWebhook(sessionId, session);
        break;
      default:
        console.error("Unknown product type", productType);
    }
  }
  
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

**Webhook URL**: `https://wdpxmwsxhckazwxufttk.supabase.co/functions/v1/stripe-webhook-handler`

**Stripe Dashboard Setup**:
- Developers → Webhooks → Add endpoint
- Events: `checkout.session.completed`
- Webhook secret → környezeti változó: `STRIPE_WEBHOOK_SECRET`

---

## 4. Idempotency Védelem Audit

**✅ HASZNÁLVA:**
- `session_id` mint idempotency kulcs minden verify functionben
- wallet_ledger.idempotency_key UNIQUE constraint

**⚠️ HIÁNYOSSÁGOK:**

1. **❌ Nincs idempotency check a CREATE payment functionekben**
   - Ha user dupla kattint a "Vásárlás" gombra, 2 Checkout session jön létre
   - **FIX**: Frontend debounce (500ms) + backend: check ha az elmúlt 5 percben már létrehozott session ugyanarra a termékre

2. **❌ wallet_ledger INSERT és profiles UPDATE nincs egy tranzakcióban**
   - A `credit_wallet()` PostgreSQL function már létezik, de nem minden verify function használja
   - **FIX**: MINDEN verify function hívja a `credit_wallet()`-t, ne manuális INSERT + UPDATE

---

## 5. Frontend Optimista Jóváírás Ellenőrzés

**KÖVETELMÉNY**: NEM szabad reward-ot megjeleníteni, amíg a backend nem confirmálta

**AUDIT**:

### PaymentSuccess.tsx
```typescript
// ❌ POTENCIÁLIS PROBLÉMA:
useEffect(() => {
  const verifyPayment = async () => {
    setVerifying(true);
    // ... verify function call
    setSuccess(true); // ← Csak API válasz után állítjuk true-ra
  };
}, []);
```

**✅ HELYES**: Csak backend response után történik success state

### InGameRescuePopup.tsx
**⚠️ ELLENŐRIZENDŐ**: Van-e olyan pont, ahol a popup eltűnik payment redirect ELŐTT?

---

## 6. Admin Manuális Credit és Visszaélés Védelem

**JELENLEGI HELYZET**: ❓ Nincs admin credit funkció a kódbázisban (vagy nincs dokumentálva)

**SZÜKSÉGES**:
- Admin oldal: "Manual Credit" UI
- Edge function: `admin-manual-credit` (role check: admin)
- Audit log: `admin_audit_log` táblába minden credit írása
- Rate limiting: max 10 manual credit / óra / admin user

---

## 7. Összefoglaló – Kritikus Javítások Listája

### P0 (AZONNAL):
1. ✅ **Stripe webhook implementálása** (`stripe-webhook-handler`) – IMPLEMENTÁLVA
2. ✅ **Session ID validáció** (verify functionekben: check customer email/ID + format + expiry) – IMPLEMENTÁLVA (mind a 4 verify functionben)
3. ✅ **Timeout és retry kezelés** (frontend: 30s timeout + retry button) – IMPLEMENTÁLVA (PaymentSuccess komponens)
4. ✅ **Tranzakciós védelem** (minden verify function használja `credit_wallet()` function-t) – IMPLEMENTÁLVA (speed-boost, premium-booster, instant-rescue)

### P1 (Sürgős):
5. ✅ **Mobile WebView fallback** (deep link + polling-based verification)
6. **Speed token collision check** (aktív token ellenőrzés vásárlás előtt)
7. **Rescue popup state management** (game_sessions.pending_rescue flag)
8. **Lives overflow policy** (dokumentálás vagy cap enforcement)

### P2 (Fontos):
9. ✅ **Admin manual credit UI + audit**
10. ✅ **Frontend debounce** (payment button: 500ms delay)

---

## 8. Következő Lépések

1. **Webhook implementálás** (stripe-webhook-handler edge function)
2. **Verify functionök refaktorálása** (credit_wallet() használata)
3. **Frontend timeout kezelés** (PaymentSuccess komponens)
4. **Mobile testing** (iOS Safari, Android Chrome WebView)
5. **Load testing** (100 concurrent payment)

---

**Audit készítő**: AI Assistant  
**Áttekintés állapota**: KÉSZ  
**Következő riport**: `02_reward_es_ledger_logika.md`
