# 10. Összefoglaló Refaktor Munkalista

**Dátum**: 2025-01-27

## PHASE A – CRITICAL (1-2 hét)

### Fizetési Rendszer (P0)
1. ✅ Stripe webhook implementálás
2. ✅ Session ID validáció
3. ✅ Timeout + retry kezelés
4. ✅ Tranzakciós védelem (credit_wallet)

### Reward & Ledger (P0)
5. ✅ Question validation (backend)
6. ✅ Balance snapshot (wallet_ledger)
7. ✅ Lives regeneration audit trail
8. ✅ Gold purchase dedukció

### Security (P0)
9. ✅ Input validation minden edge functionben
10. ✅ Rate limiting kritikus endpointokon
11. ✅ Webhook signature verification

---

## PHASE B – PERFORMANCE (2-3 hét)

### Frontend (P1)
12. ✅ Image optimization (WebP, lazy load)
13. ✅ GamePreview memoization
14. ✅ Dashboard popup atomic state
15. ✅ Confetti particle limit (mobile)

### Backend (P1)
16. ✅ In-memory pool cache (150ms → 5ms)
17. ✅ Composite indexek (lootbox, translations)
18. ✅ Materialized view (admin stats)
19. ✅ Connection pooling config

### Halott Kód (P1)
20. ✅ Delete SAFE komponensek (5 item)
21. ✅ Delete SAFE hooks (3 item)
22. ✅ Delete SAFE edge functions (2 item)

---

## PHASE C – PRODUCTION READY (1-2 hét)

### PWA (P0)
23. ✅ Service worker cache strategy
24. ✅ Offline fallback UI
25. ✅ Install prompt banner

### Mobile (P0)
26. ✅ Android WebView testing
27. ✅ iOS Safari audio policy
28. ✅ Store assets preparation

### Admin (P1)
29. ✅ Table pagination (50 rows/page)
30. ✅ Admin audit log minden critical action

---

## BECSÜLT IDŐKERET

- **Phase A**: 10-15 nap (2 fő fejlesztő)
- **Phase B**: 15-20 nap (2 fő fejlesztő)
- **Phase C**: 10-12 nap (1 fő fejlesztő + 1 tesztelő)

**TOTAL**: 6-8 hét → **Production-ready DingleUP!**

---

## KÖVETKEZŐ LÉPÉS

User döntés:
1. "start Phase A" → Kritikus fixek implementálása
2. "kérdéseim vannak" → Audit riportok áttekintése
3. "más prioritás" → Egyedi sorrend megbeszélése
