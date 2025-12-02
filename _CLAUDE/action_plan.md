# DingleUP! - Akció Terv (Csapat)

**Létrehozva:** 2025-12-02
**Cél:** A DingleUP! alkalmazás teljes migrálása Lovable-ről saját független környezetbe
**Csapat módszer:** Lépésről-lépésre, gyorsan és hatékonyan

---

## 📊 Gyors Összefoglaló

**Mit csinálunk?**
1. Új Supabase projekt létrehozása
2. Adatbázis (39 tábla + 4500 kérdés) migrálása
3. Frontend deploy Vercel-re
4. Backend (90+ edge function) deploy Supabase-re
5. Auth (username+PIN) működésének biztosítása
6. Tesztelés: regisztráció, login, játék, admin

**Várható időtartam:** 3-5 óra (csapatmunkával)

---

## 🗄️ FÁZIS 2: Új Supabase Projekt (20 perc)

### 2.1 Supabase Projekt Létrehozása
**Ki csinálja:** Backend Developer

**Lépések:**
1. Menj: https://supabase.com/dashboard
2. Kattints: **"New project"**
   - Organization: Create new vagy válassz meglévőt
   - Name: `dingleup-production`
   - Database Password: **Generálj erős jelszót** → **Mentsd el! (szükséges lesz később!)**
   - Region: **Europe (Frankfurt)** ← legközelebb Magyarországhoz
   - Pricing Plan: **Free** (kezdéshez elég)
3. Várj 2-3 percet (projekt létrejön)

**✅ Kész, ha:** Új Supabase projekt elérhető

---

### 2.2 API Kulcsok Kimentése
**Ki csinálja:** Backend Developer

**Lépések:**
1. Supabase Dashboard → **Settings → API**
2. **Másold ki ezeket (FONTOS!):**

```env
# Új projekt URL
SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co

# Anon / Public Key (frontendhez)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IlhYWFhYIiwicm9sZSI6ImFub24iLCAuLi59...

# Service Role Key (backendhez, TITKOS!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IlhYWFhYIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsIC4uLn0...

# Projekt ID
SUPABASE_PROJECT_ID=YOUR_NEW_PROJECT
```

3. **Mentsd ezeket egy biztonságos helyre** (pl. `.env.new` fájlba ideiglenesen)

**⚠️ FIGYELEM:** Service Role Key = admin jogosultság! NE commitold Git-be!

**✅ Kész, ha:** Mind a 4 érték kimásolva és biztonságos helyen van

---

## 🏗️ FÁZIS 3: Adatbázis Migrálás (30 perc)

### 3.1 Schema Importálás (39 tábla)
**Ki csinálja:** Database Admin / Backend Developer

**Lépések:**
1. Supabase Dashboard → **SQL Editor**
2. Nyisd meg lokálisan: `db/schema_latest.sql`
3. **Másold ki a TELJES fájl tartalmát** (Ctrl+A → Ctrl+C)
4. **Illeszd be az SQL Editor-ba**
5. Kattints: **"Run"** (vagy Ctrl+Enter)
6. **Várj 30-60 másodpercet**

**Ellenőrzés:**
- Database → Tables → Látod mind a 39 táblát?
  - `profiles` ✅
  - `question_pools` ✅
  - `topics` ✅
  - `game_sessions` ✅
  - stb.

**Ha hibát kapsz:**
- Másold ki a hibaüzenetet
- Javítsd a schema-ban (pl. foreign key constraint)
- Próbáld újra

**✅ Kész, ha:** Mind a 39 tábla létrejött

---

### 3.2 Adatok Importálása (4500 kérdés)
**Ki csinálja:** Database Admin

**Opció A: SQL Editor (kis adatmennyiség)**
1. Supabase Dashboard → SQL Editor
2. Másold be: `db/full_data_export_2025-12-01.sql` tartalmát
3. Run

**Opció B: psql CLI (AJÁNLOTT nagy adatmennyiséghez)**

**Telepítés (ha nincs meg):**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS (Homebrew)
brew install postgresql

# Windows (Chocolatey)
choco install postgresql
```

**Kapcsolódás:**
```bash
psql "postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_NEW_PROJECT.supabase.co:5432/postgres"
```

**Importálás:**
```sql
\i /home/rojo/dev/dingleUp/dingleup/db/full_data_export_2025-12-01.sql
```

**Ha timeout hibát kapsz:**
```sql
SET statement_timeout = '10min';
\i /home/rojo/dev/dingleUp/dingleup/db/full_data_export_2025-12-01.sql
```

**Ellenőrzés:**
```sql
-- Kérdések száma
SELECT COUNT(*) FROM question_pools;
-- Várt eredmény: ~4500

-- Témák száma
SELECT COUNT(*) FROM topics;
-- Várt eredmény: ~30

-- Profilok (ha van)
SELECT COUNT(*) FROM profiles;
```

**✅ Kész, ha:**
- question_pools: 4500 sor ✅
- topics: 30 sor ✅

---

### 3.3 RLS Policies Beállítása
**Ki csinálja:** Backend Developer

**Kritikus policy: Service role teljes hozzáférés**

1. Supabase Dashboard → Database → Tables → **profiles** → **Policies**
2. Ellenőrizd, van-e "Service role" policy
3. Ha nincs, futtasd le:

```sql
CREATE POLICY "Service role full access"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

4. Ugyanezt csináld ezekre is:
   - `game_sessions`
   - `wallet_ledger`
   - `user_roles`

**✅ Kész, ha:** Service role policy létezik minden kritikus táblán

---

## 🚀 FÁZIS 4: Backend Deploy (30 perc)

### 4.1 Supabase CLI Telepítése
**Ki csinálja:** Backend Developer

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows (Chocolatey)
choco install supabase

# Vagy NPM (minden platform)
npm install -g supabase
```

**Ellenőrzés:**
```bash
supabase --version
```

**✅ Kész, ha:** Verzió szám megjelenik (pl. `1.50.0`)

---

### 4.2 Supabase CLI Login + Link
**Ki csinálja:** Backend Developer

**Login:**
```bash
supabase login
```
- Megnyílik a böngésző → Authorize CLI

**Project Link:**
```bash
cd /home/rojo/dev/dingleUp/dingleup
supabase link --project-ref YOUR_NEW_PROJECT
```
- `YOUR_NEW_PROJECT` = az új Supabase projekt ID (pl. `abcdef123456`)

**Ellenőrzés:**
```bash
supabase projects list
```
- Látod a `dingleup-production` projektet?

**✅ Kész, ha:** CLI össze van kötve a projekttel

---

### 4.3 Edge Functions Deploy
**Ki csinálja:** Backend Developer

**Deploy mind a 90+ function:**
```bash
supabase functions deploy
```

**Várj 5-10 percet** (sok function van!)

**Ellenőrzés:**
```bash
supabase functions list
```

**Várt output:**
```
┌──────────────────────────────────┬────────────────┐
│ NAME                             │ VERSION        │
├──────────────────────────────────┼────────────────┤
│ login-with-username-pin          │ v1             │
│ register-with-username-pin       │ v1             │
│ complete-game                    │ v1             │
│ get-game-questions               │ v1             │
│ ...                              │ ...            │
└──────────────────────────────────┴────────────────┘
```

**✅ Kész, ha:** Mind a 90+ function listázva van

---

### 4.4 Secrets Beállítása
**Ki csinálja:** Backend Developer

**KRITIKUS: Backend environment változók**

```bash
supabase secrets set SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Ha Stripe van (opcionális)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**Ellenőrzés:**
```bash
supabase secrets list
```

**✅ Kész, ha:** Mind a 3 secret (SUPABASE_URL, SERVICE_ROLE_KEY, ANON_KEY) beállítva

---

## 🎨 FÁZIS 5: Frontend Deploy (20 perc)

### 5.1 .env Fájl Frissítése (Lokális)
**Ki csinálja:** Frontend Developer

**Hozz létre új `.env` fájlt:**
```bash
cd /home/rojo/dev/dingleUp/dingleup
cp .env.example .env
```

**Szerkeszd a `.env` fájlt:**
```env
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (ANON KEY)
VITE_SUPABASE_PROJECT_ID=YOUR_NEW_PROJECT
```

**⚠️ FONTOS:** Ezek az ÚJ projekt értékei legyenek, NEM a régi Lovable projekt!

**✅ Kész, ha:** .env fájl létezik és ÚJ projekt értékekkel van kitöltve

---

### 5.2 Lokális Tesztelés
**Ki csinálja:** Frontend Developer

**Telepítés:**
```bash
npm install
```

**Indítás:**
```bash
npm run dev
```

**Nyisd meg böngészőben:**
- http://localhost:8080

**Gyors teszt:**
1. Landing page betöltődik? ✅
2. Login page elérhető? `/auth/login` ✅

**⚠️ NE commitold a `.env` fájlt Git-be!**

**✅ Kész, ha:** Frontend elindul lokálisan hibák nélkül

---

### 5.3 Vercel Projekt Létrehozása
**Ki csinálja:** DevOps / Frontend Developer

**Lépések:**
1. Menj: https://vercel.com/new
2. **Import Git Repository** → Válaszd ki: `dingleup-app` (GitHub repo)
3. **Configure Project:**
   - Framework Preset: **Vite**
   - Root Directory: `./` (alapértelmezett)
   - Build Command: `npm run build`
   - Output Directory: `dist`

**✅ Kész, ha:** Vercel projekt létrejött (DE NE deploy-old még!)

---

### 5.4 Environment Variables Beállítása (Vercel)
**Ki csinálja:** DevOps

**Vercel Dashboard → Settings → Environment Variables**

**Add meg ezeket:**

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://YOUR_NEW_PROJECT.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` (ANON KEY) | Production, Preview, Development |
| `VITE_SUPABASE_PROJECT_ID` | `YOUR_NEW_PROJECT` | Production, Preview, Development |

**⚠️ FONTOS:** Mind a 3 environment-et pipáld be (Production, Preview, Development)!

**✅ Kész, ha:** Mind a 3 environment variable beállítva, mind a 3 environment-re

---

### 5.5 Deploy
**Ki csinálja:** DevOps

**Vercel Dashboard → Deployments → "Deploy"**

**Várj 2-3 percet**

**Ellenőrzés:**
- Deploy status: ✅ Ready
- URL: `https://dingleup-app.vercel.app` (vagy hasonló)

**Nyisd meg böngészőben:**
- Landing page betöltődik?

**✅ Kész, ha:** Vercel deploy sikeres, landing page elérhető

---

## ✅ FÁZIS 6: End-to-End Tesztelés (30 perc)

### 6.1 Regisztráció Teszt
**Ki csinálja:** Tester / QA

**URL:** `https://YOUR_VERCEL_URL/auth/register`

**Lépések:**
1. Username: `testuser123`
2. PIN: `987654`
3. Invitation Code: (hagyd üresen vagy adj meg egy érvényes kódot)
4. Kattints: **"Register"**

**Várt eredmény:**
- ✅ Sikeres regisztráció → automatikus átirányítás `/dashboard`-ra
- ✅ Dashboard betöltődik
- ✅ User profil látszik (username, coins, lives)

**Ha hiba:**
- Developer Tools → Network tab → Nézd meg a hibás request-et
- Console tab → Nézd meg a JavaScript hibákat

**✅ Kész, ha:** Regisztráció sikeres, dashboard betöltődik

---

### 6.2 Kijelentkezés + Bejelentkezés Teszt
**Ki csinálja:** Tester / QA

**Kijelentkezés:**
1. Dashboard → User profil → **"Logout"**

**Bejelentkezés:**
1. URL: `https://YOUR_VERCEL_URL/auth/login`
2. Username: `testuser123`
3. PIN: `987654`
4. Kattints: **"Login"**

**Várt eredmény:**
- ✅ Sikeres login → átirányítás `/dashboard`-ra
- ✅ User adatok megjelennek (ugyanaz a user)

**✅ Kész, ha:** Login működik

---

### 6.3 Játék Teszt
**Ki csinálja:** Tester / QA

**Lépések:**
1. Dashboard → **"Play Now"** gomb
2. Játék intro video lejátszódik? (skip vagy várj)
3. **Kérdések betöltődnek?**
   - Látsz 4 választ?
   - Magyar VAGY angol nyelven? (nyelv váltható)
4. **Válassz egy helyes választ**
   - Coin jóváírás azonnal látszik?
5. **15 kérdés után:**
   - Game Over screen
   - Összesített pontszám

**✅ Kész, ha:** Játék teljes körben működik, kérdések betöltődnek, coin jóváírás működik

---

### 6.4 Admin Login Teszt
**Ki csinálja:** Admin / Lead Developer

**URL:** `https://YOUR_VERCEL_URL/auth/login`

**Lépések:**
1. Username: `DingelUP!` (vagy a projekted admin username-je)
2. PIN: `ADMIN_PIN` (admin jelszó)
3. Kattints: **"Login"**

**Várt eredmény:**
- ✅ Sikeres login → átirányítás `/admin/dashboard`-ra
- ✅ Admin metrics látszódnak (user count, game count, stb.)
- ✅ "Teljes adatbázis export" gomb működik

**Ha admin user NEM létezik:**
1. Supabase Dashboard → SQL Editor
2. Hozz létre admin user-t manuálisan:
   ```sql
   -- Először regisztrálj egy user-t normál módon (frontend)
   -- Majd add hozzá admin role-t:
   INSERT INTO user_roles (user_id, role)
   VALUES (
     (SELECT id FROM profiles WHERE username = 'DingelUP!'),
     'admin'
   );
   ```

**✅ Kész, ha:** Admin login működik, admin dashboard elérhető

---

### 6.5 Leaderboard Teszt
**Ki csinálja:** Tester

**URL:** `https://YOUR_VERCEL_URL/leaderboard`

**Ellenőrzés:**
- Betöltődik a leaderboard?
- Látszanak a top 100 user-ek országonként?
- User profilok kattinthatók?

**✅ Kész, ha:** Leaderboard betöltődik hibák nélkül

---

## 🔧 FÁZIS 7: Hibaelhárítás (szükség szerint)

### Gyakori Hibák

#### ❌ "Network Error" vagy "Failed to fetch"

**Probléma:** Frontend nem éri el a Supabase backend-et

**Fix:**
1. Ellenőrizd: `.env` fájlban az ÚJ Supabase URL van?
2. Developer Tools → Network tab → Nézd meg a request URL-jét
3. Ha régi URL: Újraindítás:
   - Lokálisan: `Ctrl+C` → `npm run dev`
   - Vercel: Redeploy (Vercel Dashboard → Redeploy)

---

#### ❌ "Row level security policy violation"

**Probléma:** Backend nem tud hozzáférni a táblához

**Fix:**
```sql
-- Futtasd le Supabase SQL Editor-ban:
CREATE POLICY "Service role full access"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

#### ❌ "Invalid credentials" login után

**Probléma:** Password generálás nem egyezik backend/frontend között

**Ellenőrzés:**
1. Backend: `supabase/functions/register-with-username-pin/index.ts`
   - Password: `pin + username`
2. Frontend: `src/pages/RegisterNew.tsx`
   - Password: `validated.pin + validated.username`

**Fix:** Ha eltér, standardizáld egyikre (pl. mindig `pin + username`)

---

#### ❌ Kérdések NEM töltődnek be játékban

**Probléma:** `question_pools` tábla üres

**Fix:**
```sql
-- Ellenőrzés:
SELECT COUNT(*) FROM question_pools;

-- Ha 0: Importáld újra az adatokat
\i /path/to/db/full_data_export.sql
```

---

## 📝 Végső Checklist

```
📦 PROJEKT
[ ] GitHub repository létrehozva és kód push-olva

🗄️ ADATBÁZIS
[ ] Új Supabase projekt létrehozva
[ ] Schema (39 tábla) importálva
[ ] Adatok (4500 kérdés) importálva
[ ] RLS policies beállítva

⚙️ BACKEND
[ ] Supabase CLI telepítve
[ ] CLI login + link sikeres
[ ] Edge functions (90+) deploy-olva
[ ] Secrets (3x) beállítva

🎨 FRONTEND
[ ] .env fájl frissítve (ÚJ projekt értékekkel)
[ ] Lokális teszt sikeres (npm run dev)
[ ] Vercel projekt létrehozva
[ ] Environment variables beállítva (3x, 3 environment)
[ ] Vercel deploy sikeres

✅ TESZTELÉS
[ ] Regisztráció működik
[ ] Login működik
[ ] Játék betöltődik, kérdések megjelennek
[ ] Coin jóváírás működik
[ ] Admin login működik
[ ] Leaderboard betöltődik
```

---

## 🎉 Kész!

**Ha minden ✅, akkor:**
- Frontend URL: `https://YOUR_VERCEL_URL/`
- Backend: Supabase Edge Functions
- Adatbázis: Supabase PostgreSQL (4500 kérdés!)
- Auth: Username + PIN működik

**Következő lépések:**
- [ ] Custom domain beállítása (pl. `dingleup.hu`)
- [ ] Monitoring (Sentry, Vercel Analytics)
- [ ] Backup stratégia (hetente manuális DB dump)

**Kérdések?** Nézd meg a dokumentum **"8. Hibaelhárítás"** részét!
