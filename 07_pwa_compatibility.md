# 07. PWA Compatibility Audit

**Dátum**: 2025-01-27  
**Prioritás**: P0

## 1. Manifest.json

**ELLENŐRZÉS**: ✅ vite.config.ts PWA manifest konfigurálva
- name: "DingleUP!"
- icons: 192x192, 512x512
- display: "fullscreen"

## 2. Service Worker

**ELLENŐRZÉS**: vite-plugin-pwa workbox stratégia
**FIX szükséges**: Cache-first strategy kritikus assetekhez

## 3. Offline Support

**PROBLÉMA**: Nincs offline fallback UI
**FIX**: Offline detector + cached game questions

## 4. Install Prompt

**ELLENŐRZÉS**: beforeinstallprompt event tracking
**FIX**: Install banner UI (Dashboard)

## 5. Lighthouse PWA Score

**CÉL**: 95+ score
**AUDIT**: lighthouse --view

---
**Következő**: `08_android_ios_ready.md`
