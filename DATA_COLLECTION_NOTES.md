# Adatgyűjtési Dokumentáció / Data Collection Documentation

## Magyar verzió

### Játékos Viselkedések Analitika

#### 📊 Adatgyűjtés kezdete

| Funkció | Kezdő dátum | Megjegyzés |
|---------|-------------|------------|
| **Játék eredmények** (`game_results`) | 2025-10-17 11:23 UTC | Teljes játék adatok (helyes válaszok, válaszidők, kategóriák) |
| **Segítség használat** (`game_help_usage`) | 2025-10-24 00:15 UTC | Segítség típusok rögzítése (1/3, Átugrás, Közönség, Dupla válasz) |

#### ⚠️ Fontos megjegyzések

- **2025-10-17 és 2025-10-24 közötti játékok**: A játék eredmények elérhetők (131 játék), DE a segítség használat adatok NEM kerültek rögzítésre ebben az időszakban.
- **2025-10-24-től kezdődően**: MINDEN adat teljes körűen rögzítésre kerül (játék eredmények + segítség használat).
- Az admin felületen a "Játékos viselkedések" menüpontban csak a 2025-10-24-től kezdődő segítség használati adatok láthatók.

#### 🔍 Adatbázis táblák

Az adatgyűjtés részletei az adatbázisban is dokumentálva vannak:
- `public.game_help_usage` tábla comment mezőjében
- `public.game_results` tábla comment mezőjében  
- `public.data_collection_metadata` tábla tartalmazza az összes funkció adatgyűjtési kezdő dátumát

---

## English version

### Player Behavior Analytics

#### 📊 Data Collection Start Dates

| Feature | Start Date | Notes |
|---------|------------|-------|
| **Game Results** (`game_results`) | 2025-10-17 11:23 UTC | Complete game data (correct answers, response times, categories) |
| **Help Usage** (`game_help_usage`) | 2025-10-24 00:15 UTC | Help type tracking (1/3, Skip, Audience, Double Answer) |

#### ⚠️ Important Notes

- **Games between 2025-10-17 and 2025-10-24**: Game results are available (131 games), BUT help usage data was NOT recorded during this period.
- **From 2025-10-24 onwards**: ALL data is fully recorded (game results + help usage).
- In the admin interface "Player Behaviors" section, only help usage data from 2025-10-24 onwards is visible.

#### 🔍 Database Tables

Data collection details are also documented in the database:
- `public.game_help_usage` table comment field
- `public.game_results` table comment field
- `public.data_collection_metadata` table contains start dates for all features

---

## Technikai részletek / Technical Details

### Segítség típusok / Help Types

1. **third** (1/3) - Egy válasz eltávolítása / Remove one answer
2. **skip** - Kérdés átugrás / Skip question
3. **audience** - Közönség segítség / Audience help
4. **2x_answer** - Dupla válasz lehetőség / Double answer option

### Adatbázis lekérdezés példa / Database Query Example

```sql
-- Check data collection metadata
SELECT * FROM public.data_collection_metadata;

-- View help usage by category
SELECT 
  category,
  help_type,
  COUNT(*) as usage_count
FROM public.game_help_usage
GROUP BY category, help_type
ORDER BY category, help_type;
```

---

**Utoljára frissítve / Last updated**: 2025-10-24  
**Létrehozva / Created by**: Admin dokumentáció rendszer
