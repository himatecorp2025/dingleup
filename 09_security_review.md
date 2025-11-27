# 09. Security Review

**Dátum**: 2025-01-27  
**Prioritás**: P0

## 1. XSS/CSRF Protection

**ELLENŐRZÉS**: Input sanitization minden form-nál
**FIX**: DOMPurify library + CSP headers

## 2. Input Validation

**PROBLÉMA**: Frontend validation könnyen megkerülhető
**FIX**: Backend explicit validation minden edge functionben

## 3. Rate Limiting

**PROBLÉMA**: Nincs rate limit kritikus endpointokon
**FIX**: rpc_rate_limits tábla használata

## 4. API Token Management

**ELLENŐRZÉS**: Stripe secret key csak backend-en
**OK**: ✅ Secrets management helyes

## 5. Webhook Verification

**KRITIKUS**: Stripe webhook signature ellenőrzés
**FIX**: `stripe.webhooks.constructEvent()`

---
**Következő**: `10_osszefoglalo_refaktor_munkalista.md`
