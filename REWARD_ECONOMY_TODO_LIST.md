# 🪙 REWARD ECONOMY – TODO LIST (Future Optimizations)

**Generated:** 2025-12-01  
**Status:** NOT IMPLEMENTED YET – These are documented bottlenecks/improvements for future phases

---

## P2 – Future Optimizations (NOT CRITICAL)

### 1. ♻️ Merge lives_ledger into wallet_ledger
**Location:** Database schema  
**Reason:** lives_ledger is redundant – wallet_ledger already tracks delta_lives  
**Impact:** Reduces table count, simplifies ledger queries  
**Risk:** Medium (requires data migration)  
**Files affected:**
- `supabase/migrations/*` (new migration to merge tables)
- All edge functions using `credit_lives()` RPC → migrate to `credit_wallet()` only

---

### 2. 🔄 Remove inline regeneration from get-wallet
**Location:** `supabase/functions/get-wallet/index.ts` (lines 101-151)  
**Reason:** Concurrent get-wallet calls can cause race conditions on lives regeneration  
**Solution:** Move ALL regeneration to cron-only (`regenerate_lives_background`)  
**Impact:** Eliminates race conditions, slightly increases cron load  
**Risk:** High (requires thorough testing to ensure lives regen works correctly)  
**Files affected:**
- `supabase/functions/get-wallet/index.ts` (remove lines 105-151)
- Ensure `regenerate_lives_background` cron runs every 1 minute (already configured)

---

### 3. 🧹 Implement lootbox cleanup cron
**Location:** New cron job + edge function  
**Reason:** Expired lootboxes (status='active_drop', expires_at < NOW) remain in DB indefinitely  
**Solution:** Create `cleanup-expired-lootboxes` edge function, schedule hourly cron  
**Impact:** Reduces lootbox_instances table bloat  
**Risk:** Low  
**Files affected:**
- `supabase/functions/cleanup-expired-lootboxes/index.ts` (new file)
- `supabase/config.toml` (add cron schedule)

---

### 4. 🧹 Implement speed_tokens cleanup cron
**Location:** New cron job + edge function  
**Reason:** Expired/used speed tokens remain in DB indefinitely  
**Solution:** Create `cleanup-expired-speed-tokens` edge function, schedule daily cron  
**Impact:** Reduces speed_tokens table bloat  
**Risk:** Low  
**Files affected:**
- `supabase/functions/cleanup-expired-speed-tokens/index.ts` (new file)
- `supabase/config.toml` (add cron schedule)

---

### 5. 🎁 Implement Daily Gift streak reset
**Location:** `claim_daily_gift()` RPC function  
**Reason:** Current implementation NEVER resets streak (keeps incrementing forever)  
**Solution:** Add logic to detect if >1 day passed since last claim, reset streak to 0  
**Impact:** Enforces 7-day cycle properly  
**Risk:** Medium (requires timezone-aware date comparison)  
**Status:** EXPLICITLY marked as "NINCS IMPLEMENTÁLVA" in documentation  
**Files affected:**
- Database function `claim_daily_gift()` in migrations

---

### 6. 📊 Add balance_after snapshots to wallet_ledger
**Location:** `wallet_ledger` table schema  
**Reason:** Currently only tracks deltas (delta_coins, delta_lives), not absolute balance after transaction  
**Solution:** Add `balance_after_coins` and `balance_after_lives` columns, populate in `credit_wallet()`  
**Impact:** Improves auditability, enables balance reconstruction at any point in time  
**Risk:** Medium (requires schema migration + RPC update)  
**Files affected:**
- `supabase/migrations/*` (new migration to add columns)
- Database function `credit_wallet()` (populate new columns)

---

### 7. 🔐 Add admin reverse transaction endpoint
**Location:** New edge function `admin-reverse-transaction`  
**Reason:** No rollback mechanism exists for fraudulent/mistaken wallet transactions  
**Solution:** Create admin-only edge function to reverse any wallet_ledger transaction by ID  
**Impact:** Enables fraud detection + manual corrections  
**Risk:** High (admin abuse risk, requires audit logging)  
**Files affected:**
- `supabase/functions/admin-reverse-transaction/index.ts` (new file)
- Requires admin role check via `has_role('admin')`

---

### 8. 🚨 Add automatic fraud detection
**Location:** New edge function `fraud-detector` (scheduled cron)  
**Reason:** No automated checks for abnormal wallet activity (velocity, chargebacks, multiple IPs)  
**Solution:** Scheduled job analyzing wallet_ledger for suspicious patterns  
**Impact:** Early detection of abuse/fraud  
**Risk:** Low (read-only analysis)  
**Files affected:**
- `supabase/functions/fraud-detector/index.ts` (new file)
- `supabase/config.toml` (add cron schedule)

---

## ⚠️ CRITICAL NOTES

1. **DO NOT implement these TODOs without explicit user approval** – they are documented for awareness only
2. **lives_ledger removal** is low-risk but requires careful migration
3. **Inline regeneration removal** from get-wallet is HIGH-RISK and must be load-tested
4. **Streak reset** is intentionally NOT implemented per documentation design
5. **Admin reverse transaction** requires robust audit trail before implementation

---

**END OF TODO LIST**
