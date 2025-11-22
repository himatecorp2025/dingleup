# DingleUP! API Endpoints

Összes kritikus API végpont dokumentációja terheléses teszteléshez.

## 🔐 Autentikáció

### POST /functions/v1/register-with-username-pin

**Leírás:** Új felhasználó regisztrációja username és 6 jegyű PIN-nel.

**Body:**
```json
{
  "username": "testuser123",
  "pin": "123456",
  "country_code": "HU"
}
```

**Válasz (200):**
```json
{
  "user": { "id": "uuid", "username": "testuser123" },
  "session": { "access_token": "jwt_token" }
}
```

**Válasz (400):**
```json
{
  "error": "A felhasználónév már foglalt"
}
```

---

### POST /functions/v1/login-with-username-pin

**Leírás:** Bejelentkezés username + PIN kombinációval.

**Body:**
```json
{
  "username": "testuser123",
  "pin": "123456"
}
```

**Válasz (200):**
```json
{
  "session": {
    "access_token": "jwt_token",
    "user": { "id": "uuid", "username": "testuser123" }
  }
}
```

**Válasz (401):**
```json
{
  "error": "Hibás felhasználónév vagy PIN"
}
```

---

## 🎮 Játék

### POST /functions/v1/start-game-session

**Leírás:** Új játék indítása, 15 random kérdés lekérése.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "category": "mixed"
}
```

**Válasz (200):**
```json
{
  "sessionId": "uuid",
  "questions": [
    {
      "id": "q1",
      "text": "Mi a helyes válasz?",
      "options": ["A", "B", "C"],
      "correctAnswer": "A",
      "category": "history"
    }
  ],
  "startedAt": "2025-01-01T00:00:00Z",
  "expiresAt": "2025-01-01T00:10:00Z"
}
```

**Válasz (400):**
```json
{
  "error": "Nincs elég életed a játék indításához"
}
```

---

### POST /functions/v1/complete-game

**Leírás:** Válasz beküldése egy kérdésre.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "sessionId": "uuid",
  "questionIndex": 0,
  "correctAnswers": 1,
  "totalQuestions": 15,
  "coinsEarned": 5,
  "completed": false
}
```

**Válasz (200):**
```json
{
  "success": true,
  "coinsAwarded": 5,
  "newBalance": 105
}
```

---

### POST /functions/v1/validate-game-session

**Leírás:** Játék session validálása (anti-cheat).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "sessionId": "uuid"
}
```

**Válasz (200):**
```json
{
  "valid": true,
  "expiresAt": "2025-01-01T00:10:00Z"
}
```

---

## 🎁 Jutalmak

### POST /functions/v1/get-wallet

**Leírás:** Felhasználó pénztárcájának lekérése (coins, lives, gold).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{}
```

**Válasz (200):**
```json
{
  "coins": 100,
  "lives": 5,
  "gold": 50,
  "maxLives": 5,
  "lastLifeRegeneration": "2025-01-01T00:00:00Z",
  "nextLifeAt": "2025-01-01T00:12:00Z"
}
```

---

### POST /functions/v1/credit-gameplay-reward

**Leírás:** Játék jutalom jóváírása (idempotent).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "sessionId": "uuid",
  "questionIndex": 0,
  "coinsEarned": 5
}
```

**Válasz (200):**
```json
{
  "success": true,
  "newBalance": 105
}
```

---

## 🏆 Ranglista

### POST /functions/v1/get-daily-leaderboard-by-country

**Leírás:** Napi ranglista lekérése ország szerint (TOP 100).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "country_code": "HU"
}
```

**Válasz (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "username": "player1",
      "avatar_url": "https://...",
      "total_correct_answers": 150
    }
  ],
  "userRank": 42,
  "totalPlayers": 1234
}
```

---

### POST /functions/v1/refresh-leaderboard-cache

**Leírás:** Ranglista cache frissítése (optimalizálás).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{}
```

**Válasz (200):**
```json
{
  "success": true,
  "cacheUpdated": true
}
```

---

## 🛒 Vásárlás

### POST /functions/v1/purchase-booster

**Leírás:** Booster vásárlása aranyért vagy valós pénzért.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "booster_type_id": "uuid",
  "purchase_source": "gold"
}
```

**Válasz (200):**
```json
{
  "success": true,
  "newGoldBalance": 0,
  "boosterActivated": true
}
```

**Válasz (400):**
```json
{
  "error": "Nincs elég aranyad"
}
```

---

## 📊 Analytics

### POST /functions/v1/log-activity-ping

**Leírás:** Felhasználói aktivitás logolása (heartbeat).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "page": "game",
  "action": "question_answered"
}
```

**Válasz (200):**
```json
{
  "success": true
}
```

---

## 🔧 Segédfüggvények (lifelines)

### POST /functions/v1/activate-speed-token

**Leírás:** Sebesség booster aktiválása (gyorsabb játék).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{}
```

**Válasz (200):**
```json
{
  "success": true,
  "speedBoostActive": true,
  "expiresAt": "2025-01-01T01:00:00Z"
}
```

---

## 📋 Végpontok összesítése

| Endpoint | Metódus | Auth | Prioritás | Terhelés |
|----------|---------|------|-----------|----------|
| register-with-username-pin | POST | ❌ | Kritikus | Alacsony |
| login-with-username-pin | POST | ❌ | Kritikus | Magas |
| start-game-session | POST | ✅ | Kritikus | Nagyon magas |
| complete-game | POST | ✅ | Kritikus | Nagyon magas |
| get-wallet | POST | ✅ | Magas | Magas |
| get-daily-leaderboard-by-country | POST | ✅ | Magas | Közepes |
| credit-gameplay-reward | POST | ✅ | Kritikus | Nagyon magas |
| purchase-booster | POST | ✅ | Közepes | Alacsony |
| log-activity-ping | POST | ✅ | Alacsony | Magas |

## 🚨 Rate Limiting

Néhány endpoint rate limitált:

- `login-with-username-pin`: Max 5 sikertelen próbálkozás / 15 perc
- `purchase-booster`: Max 10 vásárlás / perc
- `log-activity-ping`: Max 1 / 5 másodperc

## ⚠️ Ismert limitációk

1. **Connection Pool:** Max 100 párhuzamos DB kapcsolat
2. **Edge Function timeout:** 30 másodperc
3. **Payload limit:** Max 1MB request body
4. **Realtime connections:** Max 500 egyidejű subscription
