# 🚀 DingleUp Load Testing Guide

## Cél
10,000 egyidejű felhasználó kezelése hibátlanul, minden funkción keresztül.

---

## 📋 Előfeltételek

### 1. K6 telepítése

**macOS:**
```bash
brew install k6
```

**Windows:**
```powershell
choco install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 2. Környezeti változók beállítása

Hozz létre egy `.env` fájlt:
```bash
BASE_URL=https://wdpxmwsxhckazwxufttk.supabase.co
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Load Testing Stratégia

### Fázisok

#### **Fázis 1: Smoke Test (Alapvető funkciók tesztelése)**
Cél: Ellenőrizni, hogy minden endpoint működik

```bash
k6 run --vus 1 --duration 30s k6-load-test.js
```

**Elvárások:**
- ✅ 0% error rate
- ✅ Válaszidő < 1s

---

#### **Fázis 2: Load Test (Normál terhelés)**
Cél: Szimulálni a napi átlagos forgalmat

```bash
k6 run --vus 100 --duration 5m k6-load-test.js
```

**Elvárások:**
- ✅ < 5% error rate
- ✅ P95 válaszidő < 2s
- ✅ P99 válaszidő < 5s

---

#### **Fázis 3: Stress Test (Maximális terhelés)**
Cél: Megtalálni a rendszer töréspontját

```bash
k6 run k6-load-test.js
```

Ez futtatja a full scenario-t:
- 100 egyidejű regisztráció
- 1,000 aktív dashboard felhasználó
- 1,000 chat üzenet/perc
- 300 játék session
- 100 shop tranzakció

**Elvárások:**
- ✅ < 10% error rate csúcsterhelésnél
- ✅ P95 < 3s
- ✅ Nincs teljes leállás

---

#### **Fázis 4: Spike Test (Hirtelen forgalom)**
Cél: Ellenőrizni a hirtelen terhelés-növekedés kezelését

```bash
k6 run --vus 0 --stage 30s:2000 --stage 1m:2000 --stage 30s:0 k6-load-test.js
```

**Elvárások:**
- ✅ Rendszer helyreáll spike után
- ✅ Nincs data loss

---

#### **Fázis 5: Soak Test (Tartós terhelés)**
Cél: Memory leak és stability problémák észlelése

```bash
k6 run --vus 500 --duration 2h k6-load-test.js
```

**Elvárások:**
- ✅ Stabil teljesítmény 2 óra után
- ✅ Nincs memory leak
- ✅ Response time nem nő lineárisan

---

## 📊 Metrikák Magyarázata

### HTTP Metrics
- **http_req_duration**: Teljes request idő
  - Target: P95 < 2000ms, P99 < 5000ms
  
- **http_req_failed**: Sikertelen requestek aránya
  - Target: < 5%
  
- **http_reqs**: Teljes request szám
  - Goal: > 1000 req/s csúcsidőben

### Custom Metrics
- **auth_success**: Sikeres autentikációk aránya
  - Target: > 95%
  
- **chat_load_success**: Chat betöltések sikeressége
  - Target: > 90%
  
- **game_start_success**: Játék indítások sikeressége
  - Target: > 95%
  
- **messages_sent**: Elküldött üzenetek száma
  - Goal: > 100/min tesztben

---

## 🔧 Teljesítmény Optimalizálások

### 1. Database Optimalizálások

#### A. Indexek létrehozása
```sql
-- Threads index a gyakori query-khez
CREATE INDEX IF NOT EXISTS idx_dm_threads_users 
ON dm_threads(user_id_a, user_id_b);

-- Messages index
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_created 
ON dm_messages(thread_id, created_at DESC);

-- Presence index
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id 
ON user_presence(user_id) 
WHERE is_online = true;

-- Message reads index
CREATE INDEX IF NOT EXISTS idx_message_reads_thread_user 
ON message_reads(thread_id, user_id);

-- Friendships index
CREATE INDEX IF NOT EXISTS idx_friendships_users 
ON friendships(user_id_a, user_id_b) 
WHERE status = 'active';
```

#### B. Database Function (get_user_threads_optimized)
```sql
CREATE OR REPLACE FUNCTION get_user_threads_optimized(p_user_id uuid)
RETURNS TABLE (
  thread_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message_at timestamptz,
  is_online boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as thread_id,
    CASE 
      WHEN t.user_id_a = p_user_id THEN t.user_id_b 
      ELSE t.user_id_a 
    END as other_user_id,
    p.username as other_user_name,
    p.avatar_url as other_user_avatar,
    t.last_message_at,
    COALESCE(up.is_online, false) as is_online
  FROM dm_threads t
  LEFT JOIN public_profiles p ON (
    CASE 
      WHEN t.user_id_a = p_user_id THEN t.user_id_b 
      ELSE t.user_id_a 
    END = p.id
  )
  LEFT JOIN user_presence up ON up.user_id = p.id
  WHERE (t.user_id_a = p_user_id OR t.user_id_b = p_user_id)
    AND (
      (t.user_id_a = p_user_id AND COALESCE(t.archived_by_user_a, false) = false)
      OR
      (t.user_id_b = p_user_id AND COALESCE(t.archived_by_user_b, false) = false)
    )
  ORDER BY t.last_message_at DESC NULLS LAST;
END;
$$;
```

### 2. Edge Function Optimalizálások

#### Használd az optimalizált get-threads funkciót:
```bash
# Deploy optimalizált verzió
supabase functions deploy get-threads-optimized

# Átirányítás az új funkcióra
# frissítsd a frontend-et hogy get-threads-optimized-ot hívjon
```

### 3. Caching Stratégia

#### Redis/Supabase Cache használata:
```typescript
// Question cache a game-hez
const questionCache = new Map();

function getCachedQuestions(category: string) {
  if (questionCache.has(category)) {
    return questionCache.get(category);
  }
  
  // Load questions
  const questions = loadQuestionsFromFile(category);
  questionCache.set(category, questions);
  
  return questions;
}
```

---

## 🚨 Problémák és Megoldások

### Probléma 1: get-threads lassú (N+1 query)
**Megoldás:**
- ✅ Használd a `get-threads-optimized` funkciót
- ✅ Deploy: `supabase functions deploy get-threads-optimized`

### Probléma 2: Túl sok signed URL generálás
**Megoldás:**
- ✅ Batch processzeld a signed URL-eket
- ✅ Cache-eld 10 percre

### Probléma 3: Game session file I/O bottleneck
**Megoldás:**
- ✅ Töltsd be a questions fájlokat memory-ba startup-kor
- ✅ Cache-eld őket

### Probléma 4: Database connection pool exhaustion
**Megoldás:**
- ✅ Használj connection pooling-ot
- ✅ Növeld a Supabase connection limit-et

---

## 📈 Eredmények Értelmezése

### Sikeres Load Test Kritériumok

✅ **Kiváló teljesítmény:**
- P95 < 1s
- P99 < 3s
- Error rate < 1%

✅ **Megfelelő teljesítmény:**
- P95 < 2s
- P99 < 5s
- Error rate < 5%

❌ **Nem megfelelő:**
- P95 > 3s
- Error rate > 10%
- Teljes leállás

### HTML Report Elemzése

A teszt után generálódik egy `summary.html` fájl:
```bash
open summary.html  # macOS
start summary.html  # Windows
```

---

## 🎓 Best Practices

### 1. Fokozatosan Skálázz
❌ NE indíts azonnal 10,000 VU-val  
✅ Kezdd 10 -> 100 -> 1,000 -> 10,000

### 2. Monitorozd Real-time
```bash
# Terminal monitoring
watch -n 1 'curl https://your-api.com/health'
```

### 3. Dokumentálj Minden Változtatást
- Baseline mérések ELŐTT
- Változtatások után újra mérés
- Jegyzetelj minden optimalizálást

### 4. Tesztelj Production-szerű Környezetben
- Azonos Supabase tier
- Azonos edge function konfig
- Azonos database méret

---

## 🔍 Monitoring Tools

### Supabase Dashboard
```
https://supabase.com/dashboard/project/wdpxmwsxhckazwxufttk
```

Nézd:
- Database > Query Performance
- Edge Functions > Logs
- Authentication > Rate Limiting

### K6 Cloud (opcionális)
```bash
k6 cloud run k6-load-test.js
```

---

## 📞 Support

Ha problémába ütközöl:
1. Ellenőrizd a `summary.json`-t részletes metrikákért
2. Nézd meg a Supabase logs-ot
3. Futtasd le a smoke test-et (1 VU) debug módban

---

## 🎯 Célok Summary

| Metrika | Target | Stretch Goal |
|---------|--------|--------------|
| Egyidejű felhasználók | 10,000 | 15,000 |
| Requests/sec | 1,000 | 2,000 |
| P95 Response Time | < 2s | < 1s |
| Error Rate | < 5% | < 1% |
| Uptime | 99.9% | 99.99% |

---

**Utolsó frissítés:** 2025-10-23  
**Verzió:** 1.0  
**Szerző:** DingleUp DevOps Team
