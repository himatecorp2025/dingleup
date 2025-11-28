# 📱 Natív Mobilfizetés Használati Útmutató

## Áttekintés

A DingleUP! játék központi mobilfizetési rendszert használ, amely natív fizetési élményt nyújt:
- **iOS**: Apple Pay sheet
- **Android**: Google Pay sheet  
- **Fallback**: Stripe kártyás fizetés (ha natív nem elérhető)

## 🏗️ Architektúra

### Backend (Supabase Edge Functions)

1. **`create-payment-intent`**: Stripe PaymentIntent létrehozása
   - Input: `productType`, `amount`, `currency`, `metadata`
   - Output: `clientSecret`, `paymentIntentId`

2. **`verify-payment-intent`**: Fizetés verifikálás + jutalom jóváírás
   - Input: `paymentIntentId`
   - Output: `success`, `goldGranted`, `livesGranted`, stb.

### Frontend

1. **`useMobilePayment` hook**: Központi fizetési logika
   - Payment Request API kezelés (Apple Pay / Google Pay)
   - Automatikus fallback Stripe Elements-re
   - Backend verifikáció és jutalom jóváírás

2. **`MobilePaymentButton` komponens**: Újrafelhasználható fizetési gomb
   - Automatikus natív gomb megjelenítés (ha elérhető)
   - Fallback standard gombra

## 🚀 Használat

### 1. Hook használata (egyszerű integráció)

```tsx
import { useMobilePayment } from '@/hooks/useMobilePayment';

const MyComponent = () => {
  const { startPayment, isProcessing } = useMobilePayment();

  const handleBuyLootbox = async () => {
    await startPayment({
      productType: 'lootbox',
      amount: 199, // cents ($1.99)
      currency: 'usd',
      displayName: '1 Ajándékdoboz',
      metadata: { boxes: '1' },
      onSuccess: () => {
        console.log('Sikeres vásárlás!');
        // Frissítsd az UI-t, töltsd újra a wallet adatokat, stb.
      },
      onError: (error) => {
        console.error('Fizetési hiba:', error);
      }
    });
  };

  return (
    <button onClick={handleBuyLootbox} disabled={isProcessing}>
      {isProcessing ? 'Feldolgozás...' : 'Megszerzem'}
    </button>
  );
};
```

### 2. Komponens használata (még egyszerűbb)

```tsx
import { MobilePaymentButton } from '@/components/MobilePaymentButton';

const MyComponent = () => {
  return (
    <MobilePaymentButton
      productType="lootbox"
      amount={199}
      currency="usd"
      displayName="1 Ajándékdoboz"
      metadata={{ boxes: '1' }}
      buttonText="Megszerzem"
      onSuccess={() => console.log('Siker!')}
    />
  );
};
```

## 📦 Terméktípusok

### Lootbox vásárlás

```tsx
await startPayment({
  productType: 'lootbox',
  amount: 199, // $1.99
  currency: 'usd',
  displayName: '1 Ajándékdoboz',
  metadata: { boxes: '1' }
});
```

### Speed Booster vásárlás

```tsx
await startPayment({
  productType: 'speed_booster',
  amount: 1490, // $14.90
  currency: 'usd',
  displayName: 'GigaSpeed (12× gyorsítás)',
  metadata: {
    speed_token_count: '1',
    speed_duration_min: '10',
    gold_reward: '0',
    lives_reward: '0'
  }
});
```

### Premium Booster vásárlás

```tsx
await startPayment({
  productType: 'premium_booster',
  amount: 249, // $2.49
  currency: 'usd',
  displayName: 'Premium Speed Booster',
  metadata: { booster_code: 'PREMIUM' }
});
```

### Instant Rescue (játék közben)

```tsx
await startPayment({
  productType: 'instant_rescue',
  amount: 149, // $1.49
  currency: 'usd',
  displayName: 'Azonnali mentés',
  metadata: { game_session_id: 'session-123' }
});
```

## 🔧 Meglévő gombok átkötése

### Példa: Gifts.tsx (lootbox vásárlás)

**Előtte:**
```tsx
const handlePurchase = async () => {
  const { data } = await supabase.functions.invoke('create-lootbox-payment', {
    body: { priceId: 'price_123', boxes: 1 }
  });
  
  if (data?.url) {
    window.location.href = data.url; // Stripe Checkout redirect
  }
};
```

**Utána:**
```tsx
import { useMobilePayment } from '@/hooks/useMobilePayment';

const { startPayment } = useMobilePayment();

const handlePurchase = async () => {
  await startPayment({
    productType: 'lootbox',
    amount: 199,
    currency: 'usd',
    displayName: '1 Ajándékdoboz',
    metadata: { boxes: '1' },
    onSuccess: async () => {
      // Lootbox lista frissítése
      const { data } = await supabase
        .from('lootbox_instances')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'stored');
      
      setStoredLootboxes(data || []);
    }
  });
};
```

## 🎯 Működés menete

1. **Felhasználó kattintás** a vásárlás gombra
2. **Frontend**: `startPayment()` meghívása
3. **Backend**: `create-payment-intent` → PaymentIntent létrehozás
4. **Frontend**: Payment Request API check
   - ✅ **Ha támogatott** → Natív fizetési sheet (Apple Pay / Google Pay)
   - ❌ **Ha nem** → Stripe Elements kártyás form
5. **Felhasználó fizet** a natív sheet-en
6. **Stripe** megerősíti a fizetést
7. **Backend**: `verify-payment-intent` → jutalom jóváírás
8. **Frontend**: `onSuccess` callback → UI frissítés

## 📱 Platform támogatás

### Web / PWA (mobil böngésző)
- ✅ Payment Request API teljes támogatás
- ✅ Apple Pay (Safari, iOS 10+)
- ✅ Google Pay (Chrome, Android 5+)

### Capacitor (natív app)
- ✅ iOS WebView → Apple Pay
- ✅ Android WebView → Google Pay
- ⚠️ Automatikus fallback, ha natív fizetés nem elérhető

## ⚠️ Fontos jegyzet

- **SOHA ne** írd jóvá a jutalmat frontend oldalon optimistán!
- **MINDIG** várj a backend `verify-payment-intent` válaszára
- **MINDIG** használd az `onSuccess` callback-et UI frissítéshez
- **Idempotencia**: A backend automatikusan kezeli a dupla jóváírásokat

## 🔐 Biztonság

- Backend ellenőrzi a Stripe PaymentIntent státuszát
- User ID validáció minden fizetésnél
- Idempotencia kulcs minden tranzakcióhoz
- Rate limiting a payment endpoint-okon

## 🚧 Hibaelhárítás

### "Payment Request API not supported"
→ A készülék/böngésző nem támogatja a natív fizetést. Automatikus fallback a Stripe Elements-re.

### "Payment verification failed"
→ Backend nem tudta ellenőrizni a fizetést. Ellenőrizd a Stripe webhook-okat és a backend logokat.

### Natív sheet nem jelenik meg iOS-en
→ Ellenőrizd:
1. Safari böngésző vagy PWA használata (nem Chrome)
2. Apple Pay engedélyezve a készüléken
3. Hozzáadott bankkártya az Apple Wallet-ben

### Natív sheet nem jelenik meg Androidon
→ Ellenőrizd:
1. Chrome böngésző használata
2. Google Pay telepítve
3. Hozzáadott fizetési mód a Google Pay-ben
