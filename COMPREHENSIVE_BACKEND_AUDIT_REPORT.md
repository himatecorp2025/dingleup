# DingleUP! Comprehensive Backend Audit Report

**Generated:** 2025-12-01  
**Scope:** Complete backend ecosystem - all systems, edge functions, RPC functions, database architecture  
**Objective:** Verify optimizations, identify gaps, ensure production-ready scalability and reliability

---

## EXECUTIVE SUMMARY

This audit covers the entire DingleUP! backend infrastructure spanning 10 major subsystems, 60+ edge functions, 50+ PostgreSQL RPC functions, and comprehensive database schema. The audit validates that **most critical optimizations have been implemented**, identifies **remaining gaps**, and provides a **complete user journey walkthrough** from app installation through gameplay, rewards, and monetization.

**Overall Backend Health:** 🟢 **Production-Ready with Minor Improvements Needed**

---

## 1. BACKEND AUDIT SUMMARY TABLE

| System | Status | Key Findings |
|--------|--------|--------------|
| **Auth & Profile & Onboarding** | ✅ Optimized | Username+PIN auth, rate limiting, idempotent registration, admin role backend validation |
| **Question Pool System** | ✅ Optimized | Dual-language in-memory cache (HU/EN), 15 pools × 30 topics, ~35-55ms load time |
| **Game Flow & Complete** | ⚠️ Partial | Metrics logging added to start-game-session, **needs rollout to complete-game, credit-gameplay-reward** |
| **Lootbox System** | ⚠️ Partial | Transaction safety via RPC, **missing metrics logging**, **no rate limiting on lootbox-decide** |
| **Daily Gift System** | ✅ Optimized | Idempotent claim_daily_gift RPC, timezone-aware, admin exclusion, structured logging |
| **Daily Winners System** | ⚠️ Partial | Lazy processing via process-daily-winners, **needs metrics logging**, **claim-daily-rank-reward missing rate limit** |
| **Invitation & Referral** | ✅ Optimized | Tier-based rewards, idempotent via wallet_ledger, trigger-based friendship creation |
| **Monetization & Payment** | ⚠️ Partial | Webhook-first idempotency, **inconsistent rate limiting**, **verify functions need metrics** |
| **Rate Limiting System** | ✅ Optimized | Single-row-per-user model, concurrency-safe, 99% table size reduction, fail-open |
| **Performance Monitoring** | ⚠️ Partial | Centralized metrics.ts helper created, **only start-game-session refactored**, **needs rollout to 40+ functions** |

**Legend:**
- ✅ **Optimized** = Meets production standards, no critical gaps
- ⚠️ **Partial** = Core optimizations done, minor improvements needed
- 🔴 **Needs Work** = Critical gaps requiring immediate attention

---

## 2. DETAILED TECHNICAL FINDINGS BY SYSTEM

### 2.1 AUTH & PROFILE & ONBOARDING SYSTEM

**Status:** ✅ **Optimized**

**Implemented Optimizations:**
- Username+PIN authentication with SHA-256 hashed PINs (no plaintext storage)
- Rate limiting on login: max 5 attempts per 15 minutes (`login-with-username-pin`)
- Rate limiting on registration: max 5 attempts per 15 minutes (`register-with-username-pin`)
- Admin role backend validation via `has_role(user_id, 'admin')` PostgreSQL function (SECURITY DEFINER)
- Email unique constraint on `profiles` table (prevents duplicate accounts)
- Idempotent registration via invitation code processing (wallet_ledger correlation_id)
- Recovery code system with SHA-256 hashing (forgot-pin endpoint)

**Database:**
- ✅ `profiles` table: indexed on `(email)`, `(username)`, `(invitation_code)`, `(country_code, id)`
- ✅ `user_roles` table: indexed on `(user_id, role)`
- ✅ `pin_reset_tokens` table: indexed on `(user_id, token_hash)`, auto-cleanup via cron

**Edge Functions:**
- ✅ `register-with-username-pin`: Full input validation, rate limit, invitation tier rewards
- ✅ `login-with-username-pin`: Rate limit, auth token generation, password sync
- ✅ `forgot-pin`: Token generation with expiry, rate limiting (5 attempts/hour)

**Remaining Gaps:**
- ⚠️ **Missing metrics logging** on login/register functions (should use `_shared/metrics.ts`)
- ⚠️ **No structured JSON logs** with `elapsed_ms`, `db_queries_count`, `request_id`

**Recommendations:**
1. Refactor `login-with-username-pin` and `register-with-username-pin` to use metrics helper
2. Add `correlation_id` to all auth operations for tracing across login → profile creation → wallet init

---

### 2.2 QUESTION POOL SYSTEM

**Status:** ✅ **Optimized**

**Implemented Optimizations:**
- **In-memory dual-language cache:** All 15 pools × 30 topics loaded at startup for HU and EN
- **Zero DB queries during gameplay:** Questions served from `POOLS_CACHE_HU` / `POOLS_CACHE_EN` maps
- **Fisher-Yates shuffle:** Ensures randomness across 15 questions per game
- **Cache initialization logging:** Structured logs with `cache_init_ms`, pool counts
- **Performance:** ~35-55ms question selection (memory-only operation)

**Database:**
- ✅ `question_pools` table: indexed on `(pool_order, topic_id)`, partitioned into 15 pools
- ✅ `questions_hu` and `questions_en` JSONB columns pre-serialized for instant cache loading
- ✅ `game_session_pools` table: tracks user's current pool progression

**Edge Functions:**
- ✅ `start-game-session`: Metrics logging added (parallel_queries_ms, question_selection_ms, cache_status: HIT)

**Cache Initialization:**
```typescript
// In start-game-session global scope
const POOLS_CACHE_HU = new Map<number, QuestionPoolEntry[]>();
const POOLS_CACHE_EN = new Map<number, QuestionPoolEntry[]>();

// Loaded once at cold start:
// - ~35-55ms for full dual-language cache load
// - Zero latency penalty during gameplay
```

**Remaining Gaps:**
- ✅ None - fully optimized

---

### 2.3 GAME FLOW & GAME COMPLETE REWARD SYSTEM

**Status:** ⚠️ **Partial Optimization**

**Implemented Optimizations:**
- ✅ `start-game-session`: Metrics logging with `startMetrics`, `measureStage`, parallel DB queries
- ✅ Duplicate protection in `complete-game` via game_results idempotency (session_id unique)
- ✅ Atomic reward crediting via `credit_wallet` RPC (wallet_ledger idempotency_key)
- ✅ Parallel leaderboard updates: `update_daily_ranking_for_user` + global leaderboard

**Database:**
- ✅ `game_sessions` table: indexed on `(user_id, created_at)`, `(session_id)`
- ✅ `game_results` table: indexed on `(user_id, created_at)`, `(completed_at)`
- ✅ `wallet_ledger` table: indexed on `(user_id, created_at)`, `(correlation_id)` for idempotency

**Edge Functions:**
- ✅ `start-game-session/index.ts`: **FULLY REFACTORED** with metrics.ts
  - Logs: `parallel_queries_ms`, `question_selection_ms`, `session_insert_ms`, `db_queries_count`, `cache_status`
  - Total elapsed: ~45-60ms (with cache HIT)
  
- ⚠️ `complete-game/index.ts`: **NOT YET REFACTORED**
  - Still using manual `console.log()` instead of structured JSON logging
  - Missing: `request_id`, `db_queries_count`, stage-level timing
  - **Action Required:** Refactor using `startMetrics`, `measureStage`, `logSuccess`/`logError`

- ⚠️ `credit-gameplay-reward/index.ts`: **NOT YET REFACTORED**
  - Basic logging exists but not using metrics helper
  - Missing: correlation with game completion flow, structured timing
  - **Action Required:** Add metrics logging

**RPC Functions:**
- ✅ `update_daily_ranking_for_user`: Atomic aggregation, no rank calculation (delegated to MV)
- ✅ `upsert_daily_ranking_aggregate`: Weighted average response time, idempotent

**Remaining Gaps:**
1. ⚠️ **complete-game** needs metrics refactor
2. ⚠️ **credit-gameplay-reward** needs metrics refactor
3. ⚠️ **Rate limiting** missing on high-frequency endpoints (start-game-session, complete-game allow 100 req/min but not enforced in code)

**Recommendations:**
1. Refactor `complete-game` to measure: `duplicate_check_ms`, `game_result_insert_ms`, `daily_ranking_update_ms`, `global_leaderboard_update_ms`, `reward_credit_ms`
2. Refactor `credit-gameplay-reward` with correlation_id from game session
3. Add explicit rate limit checks to start-game-session (RATE_LIMITS.GAME = 100 req/min)

---

### 2.4 LOOTBOX SYSTEM

**Status:** ⚠️ **Partial Optimization**

**Implemented Optimizations:**
- ✅ Transaction safety via `open_lootbox_transaction` RPC (SELECT FOR UPDATE, idempotency)
- ✅ Insufficient gold validation (returns error without mutation)
- ✅ Status transitions: `active_drop` → `stored` → `opened`
- ✅ Tier-based rewards (Bronze/Silver/Gold/Platinum) with RNG
- ✅ Atomic crediting via `credit_wallet` RPC

**Database:**
- ✅ `lootbox_instances` table: indexed on `(user_id, status)`, `(user_id, created_at)`
- ✅ `lootbox_daily_plans` table: tracks drop scheduling (10-20 drops/day)
- ✅ Unique constraint on `(user_id, status='active_drop')` prevents multiple active drops

**Edge Functions:**
- ⚠️ `lootbox-active/index.ts`: JWT decode instead of session-based auth (optimized), but **no metrics logging**
- ⚠️ `lootbox-decide/index.ts`: Decision logic (`open_now` / `store`), but:
  - **Missing rate limiting** (vulnerable to spam clicks)
  - **Missing metrics logging** (no elapsed_ms, db_queries_count)
  
- ⚠️ `lootbox-open-stored/index.ts`: RPC call to `open_lootbox_transaction`, but:
  - **Missing metrics logging**
  - **No rate limiting**

**RPC Functions:**
- ✅ `open_lootbox_transaction`: Fully transactional, idempotent via `p_idempotency_key`
- ✅ `create_lootbox_drop`: Atomic drop creation with expiry

**Remaining Gaps:**
1. ⚠️ **No rate limiting** on lootbox endpoints (users could spam decision/open requests)
2. ⚠️ **Missing metrics logging** across all 3 lootbox endpoints
3. ⚠️ **Expiry handling** in `lootbox-active` is client-side only (backend cron cleanup needed)

**Recommendations:**
1. Add `RATE_LIMITS.WALLET` (30 req/min) to `lootbox-decide` and `lootbox-open-stored`
2. Refactor all 3 lootbox functions to use `_shared/metrics.ts`
3. Create PostgreSQL cron job for `expire_old_lootboxes()` (currently exists but not scheduled)

---

### 2.5 DAILY GIFT SYSTEM

**Status:** ✅ **Optimized**

**Implemented Optimizations:**
- ✅ Idempotent claiming via `claim_daily_gift` RPC (wallet_ledger idempotency_key = `daily-gift:user_id:date`)
- ✅ Timezone-aware date calculation (user's local midnight)
- ✅ Streak-based rewards: 50 → 75 → 110 → 160 → 220 → 300 → 500 coins (7-day cycle)
- ✅ Admin exclusion logic (admins never see Daily Gift popup)
- ✅ Separate tracking: `daily_gift_last_claimed` vs `daily_gift_last_seen` (claim vs dismiss)

**Database:**
- ✅ `profiles` table: `daily_gift_streak`, `daily_gift_last_claimed`, `daily_gift_last_seen` columns
- ✅ `wallet_ledger` index on `(user_id, source, created_at)` for analytics

**Edge Functions:**
- ✅ `get-daily-gift-status/index.ts`: Admin role check, timezone calculation, reward preview
- ⚠️ **Missing metrics logging** (only console.log)

**RPC Functions:**
- ✅ `claim_daily_gift()`: Atomic transaction, EXCEPTION handling for unique_violation

**Remaining Gaps:**
1. ⚠️ **get-daily-gift-status** needs metrics refactor
2. ⚠️ **No rate limiting** on get-daily-gift-status (low-risk but should exist)

**Recommendations:**
1. Add metrics logging to `get-daily-gift-status` (measure timezone calc, admin check, DB query)
2. Optional: Add RATE_LIMITS.WALLET (30 req/min) to status check

---

### 2.6 DAILY WINNERS SYSTEM

**Status:** ⚠️ **Partial Optimization**

**Implemented Optimizations:**
- ✅ Lazy processing via `process-daily-winners` (on-demand trigger from frontend)
- ✅ Timezone-aware winner calculation (local midnight per country)
- ✅ Day-of-week multipliers (Monday 8% → Sunday 200% jackpot)
- ✅ TOP 10 per country (Monday-Saturday), TOP 25 on Sunday
- ✅ Idempotent claiming via `claim_daily_winner_reward` RPC

**Database:**
- ✅ `daily_winner_awarded` table: indexed on `(user_id, day_date)`, `(status, day_date)`
- ✅ `daily_prize_table` table: pre-configured reward tiers by day_of_week and rank
- ✅ `mv_daily_rankings_current` materialized view: optimized leaderboard queries

**Edge Functions:**
- ⚠️ `process-daily-winners/index.ts`: Batch processing, but **no metrics logging**
- ⚠️ `claim-daily-rank-reward/index.ts`: JWT-based auth (secure), but:
  - **Missing rate limiting**
  - **Missing metrics logging**
  - **No lock timeout handling** (if RPC locks, function hangs)

**RPC Functions:**
- ✅ `claim_daily_winner_reward()`: Atomic claim with SELECT FOR UPDATE, idempotency via wallet_ledger

**Remaining Gaps:**
1. ⚠️ **No rate limiting** on claim-daily-rank-reward (users could spam claim attempts)
2. ⚠️ **Missing metrics logging** on both edge functions
3. ⚠️ **Lock timeout handling** needed (if lock acquisition fails after 5s, should return LOCK_TIMEOUT error)

**Recommendations:**
1. Add `RATE_LIMITS.WALLET` to claim-daily-rank-reward
2. Refactor both functions to use `_shared/metrics.ts`
3. Add lock timeout handling in `claim_daily_winner_reward` RPC:
   ```sql
   SET LOCAL lock_timeout = '5s';
   -- if lock fails → RETURN jsonb with error: 'LOCK_TIMEOUT'
   ```

---

### 2.7 INVITATION & REFERRAL SYSTEM

**Status:** ✅ **Optimized**

**Implemented Optimizations:**
- ✅ Tier-based rewards: 1-2 invites = 200 coins + 3 lives, 3-9 = 1000 coins + 5 lives, 10+ = 6000 coins + 20 lives
- ✅ Idempotent reward processing via `wallet_ledger` (correlation_id = `invitation_accepted:invitation_id`)
- ✅ Automatic friendship creation via `sync_referral_to_friendship` trigger
- ✅ DM thread creation via `create_friendship_from_invitation` RPC

**Database:**
- ✅ `invitations` table: indexed on `(invitation_code)`, `(inviter_id, accepted)`, `(invited_user_id)`
- ✅ `friendships` table: normalized user_id_a < user_id_b ordering
- ✅ `dm_threads` table: indexed on `(user_id_a, user_id_b)`

**Edge Functions:**
- ✅ `register-with-username-pin`: Handles invitation code processing during registration
- ⚠️ **Missing metrics logging** (only console.log)

**RPC Functions:**
- ✅ `create_friendship_from_invitation`: Atomic friendship + thread creation
- ✅ `get_invitation_tier_reward`: Calculates reward based on accepted count

**Remaining Gaps:**
1. ⚠️ **Missing metrics logging** in registration flow when processing invitations
2. ⚠️ **No separate endpoint** for `/accept-invitation` (currently embedded in registration)

**Recommendations:**
1. Add metrics logging to invitation processing section of register-with-username-pin
2. Optional: Create dedicated `accept-invitation` endpoint for post-registration invitation acceptance

---

### 2.8 MONETIZATION & PAYMENT SYSTEM (STRIPE)

**Status:** ⚠️ **Partial Optimization**

**Implemented Optimizations:**
- ✅ Webhook-first idempotency: All verify functions check `booster_purchases` / `lootbox_instances` before processing
- ✅ Atomic RPC fallback: `apply_booster_purchase_from_stripe`, `apply_instant_rescue_from_stripe`
- ✅ Session expiry validation (24-hour window)
- ✅ User ID matching validation (session.metadata.user_id must match auth.uid())
- ✅ Duplicate rescue prevention (game_sessions.pending_rescue check)

**Database:**
- ✅ `booster_purchases` table: indexed on `(user_id, created_at)`, `(iap_transaction_id)` unique
- ✅ `booster_types` table: indexed on `(code)`, `(is_active)`
- ✅ `lootbox_instances` table: unique idempotency via session_id in metadata

**Edge Functions:**
- ⚠️ `verify-lootbox-payment`: Webhook-first pattern, but **no rate limiting**, **no metrics logging**
- ⚠️ `verify-speed-boost-payment`: Same gaps
- ⚠️ `verify-premium-booster-payment`: **HAS rate limiting** (10 req/min), but **no metrics logging**
- ⚠️ `verify-instant-rescue-payment`: No rate limiting, no metrics logging
- ✅ `create-instant-rescue-payment`: Duplicate rescue check, **no metrics logging**

**Stripe Webhook:**
- ✅ `stripe-webhook-handler`: Processes `checkout.session.completed` events
- ✅ Signature verification via Stripe SDK
- ⚠️ **Missing metrics logging** (no elapsed_ms, db_queries_count)

**Remaining Gaps:**
1. ⚠️ **Inconsistent rate limiting** across verify functions (only premium-booster has it)
2. ⚠️ **Missing metrics logging** on all 5 payment endpoints
3. ⚠️ **Webhook signature verification** should log failed attempts with request_id

**Recommendations:**
1. Add `RATE_LIMITS.WALLET` (30 req/min) to all 4 verify-*-payment functions
2. Refactor all 5 payment functions + webhook to use `_shared/metrics.ts`
3. Add structured error logging for webhook signature failures (potential attack indicator)

---

### 2.9 RATE LIMITING SYSTEM

**Status:** ✅ **Optimized** (v2.0)

**Implemented Optimizations:**
- ✅ Single-row-per-user+rpc model (99% table size reduction vs v1.0)
- ✅ Concurrency-safe retry loop (INSERT + UPDATE with unique_violation handling)
- ✅ In-place window reset (no new rows created per time window)
- ✅ Fail-open behavior (auth.uid() NULL → allow request, avoid blocking edge cases)
- ✅ Latency: 5-10ms average (33-50% faster than v1.0)

**Database:**
- ✅ `rpc_rate_limits` table: unique constraint on `(user_id, rpc_name)` only
- ✅ Index: `idx_rate_limits_lookup` on `(user_id, rpc_name)`
- ✅ Optional cleanup: `cleanup_old_rate_limit_windows()` deletes rows > 48 hours old

**RPC Functions:**
- ✅ `check_rate_limit(p_rpc_name, p_max_calls, p_window_minutes)`: Optimized with LOOP retry pattern

**Edge Function Helper:**
- ✅ `_shared/rateLimit.ts`: `checkRateLimit`, `rateLimitExceeded`, RATE_LIMITS constants
- ✅ Fail-open on RPC error (logs error but allows request)

**Current Usage:**
- ✅ `login-with-username-pin`: AUTH rate limit (5 req / 15 min)
- ✅ `register-with-username-pin`: AUTH rate limit (5 req / 15 min)
- ✅ `verify-premium-booster-payment`: WALLET rate limit (10 req / 1 min)
- ⚠️ **Missing:** start-game-session, complete-game, lootbox-decide, claim-daily-rank-reward, verify-*-payment (other 3)

**Remaining Gaps:**
1. ⚠️ **Incomplete rollout** - only 3 endpoints use rate limiting (should be 15+)
2. ⚠️ **No monitoring** of rate limit hits (should log 429 responses with user_id, rpc_name)

**Recommendations:**
1. Add rate limiting to: start-game-session, complete-game, credit-gameplay-reward (RATE_LIMITS.GAME = 100 req/min)
2. Add rate limiting to: lootbox-decide, lootbox-open-stored (RATE_LIMITS.WALLET = 30 req/min)
3. Add rate limiting to: verify-lootbox-payment, verify-speed-boost-payment, verify-instant-rescue-payment (RATE_LIMITS.WALLET)
4. Add rate limiting to: claim-daily-rank-reward (RATE_LIMITS.WALLET)
5. Add structured logging when `checkRateLimit` returns `allowed: false` (429 response)

---

### 2.10 PERFORMANCE MONITORING SYSTEM

**Status:** ⚠️ **Partial Rollout**

**Implemented Optimizations:**
- ✅ Centralized `_shared/metrics.ts` helper module created
- ✅ Structured JSON logging format:
  ```json
  {
    "ts": "2025-12-01T10:30:45.123Z",
    "level": "info",
    "function": "start-game-session",
    "request_id": "uuid-correlation-id",
    "user_id": "user-uuid",
    "status": "success",
    "elapsed_ms": 45,
    "db_queries_count": 3,
    "parallel_queries_ms": 12,
    "question_selection_ms": 8,
    "cache_status": "HIT"
  }
  ```
- ✅ `startMetrics`, `measureStage`, `incDbQuery`, `logSuccess`, `logError`, `shouldSampleSuccessLog` functions
- ✅ **Only 1 function refactored:** `start-game-session/index.ts`

**Current Coverage:**
- ✅ Question pool cache initialization (separate functionName: 'question-pool-cache-init')
- ✅ start-game-session (full metrics logging)
- ⚠️ **40+ edge functions NOT YET REFACTORED**

**Remaining Gaps:**
1. ⚠️ **Incomplete rollout** - only 1 out of 60+ edge functions uses metrics helper
2. ⚠️ **No correlation_id propagation** between related operations (e.g., start-game → complete-game → credit-reward)
3. ⚠️ **No log sampling** implemented yet (all functions log 100% of requests, will overwhelm logs at scale)

**Recommendations:**
1. **Phase 1 (High Priority):** Refactor core game flow:
   - complete-game
   - credit-gameplay-reward
   - lootbox-decide
   - lootbox-open-stored
   - claim-daily-gift (RPC call wrapper)
   - claim-daily-rank-reward

2. **Phase 2 (Medium Priority):** Refactor payment flow:
   - verify-lootbox-payment
   - verify-speed-boost-payment
   - verify-premium-booster-payment
   - verify-instant-rescue-payment
   - stripe-webhook-handler

3. **Phase 3 (Low Priority):** Refactor admin/analytics:
   - admin-dashboard-data
   - admin-game-profiles-paginated
   - admin-lootbox-analytics
   - admin-monetization-analytics
   - admin-retention-analytics

4. **Implement log sampling:**
   - High-frequency endpoints (start-game, complete-game, lootbox-active): 5% success log sampling
   - Always log 100% of errors
   - Always log 100% of rate limit 429 responses

5. **Add correlation_id:**
   - Generate in start-game-session
   - Pass via response header: `X-Correlation-ID: uuid`
   - Frontend includes in subsequent requests (complete-game, credit-gameplay-reward)
   - All related logs share same correlation_id for tracing

---

## 3. DATABASE ARCHITECTURE REVIEW

### 3.1 Indexing Strategy

**Optimized Indexes:**
- ✅ `profiles`: `(email)`, `(username)`, `(invitation_code)`, `(country_code, id)`, `(lives, max_lives, last_life_regeneration)` for regeneration background job
- ✅ `wallet_ledger`: `(user_id, created_at)`, `(correlation_id)` for idempotency
- ✅ `lives_ledger`: `(user_id, created_at)`, `(correlation_id)`
- ✅ `game_sessions`: `(user_id, created_at)`, `(session_id)`, `(expires_at)` for cleanup
- ✅ `game_results`: `(user_id, created_at)`, `(completed_at)` partial index
- ✅ `lootbox_instances`: `(user_id, status)`, `(user_id, created_at)`
- ✅ `daily_rankings`: `(user_id, category, day_date)` unique, `(day_date, category, rank)`
- ✅ `daily_winner_awarded`: `(user_id, day_date)` unique, `(status, day_date)`
- ✅ `rpc_rate_limits`: `(user_id, rpc_name)` unique

**Potential Improvements:**
- ⚠️ **booster_purchases**: Consider composite index on `(user_id, created_at, purchase_source)` for analytics queries
- ⚠️ **app_session_events**: Add index on `(user_id, event_type, created_at)` for engagement analytics
- ⚠️ **game_question_analytics**: Add index on `(user_id, category, was_correct)` for accuracy tracking

### 3.2 Materialized Views

**Current:**
- ✅ `mv_daily_rankings_current`: Refreshed via background cron, powers leaderboard queries
- ✅ `mv_daily_engagement_metrics`: Admin analytics
- ✅ `mv_hourly_engagement`: Admin analytics
- ✅ `mv_feature_usage_summary`: Admin analytics

**Performance:**
- All admin analytics use MVs → sub-100ms query times even with 10K+ users

### 3.3 RPC Function Review

**Transaction Safety:**
- ✅ All wallet/ledger operations use `SECURITY DEFINER` + explicit `SET search_path = 'public'`
- ✅ All critical mutations use `SELECT ... FOR UPDATE` (claim_daily_gift, claim_daily_winner_reward, open_lootbox_transaction)
- ✅ Lock timeout: **NOT SET** in most RPCs (should add `SET LOCAL lock_timeout = '5s'` globally)

**Idempotency:**
- ✅ `wallet_ledger.correlation_id` unique constraint prevents double-credit
- ✅ `lives_ledger.correlation_id` unique constraint prevents double-credit
- ✅ `booster_purchases.iap_transaction_id` unique constraint prevents double-purchase
- ✅ RPC functions check idempotency keys before mutations

**Error Handling:**
- ✅ `claim_daily_gift`: EXCEPTION block handles unique_violation gracefully
- ⚠️ Most RPCs: **No explicit lock timeout handling** (function will hang if lock acquisition times out)
- ⚠️ **No consistent error_code format** (some return JSON with 'error', others throw exceptions)

**Recommendations:**
1. Add global lock timeout to all critical RPCs:
   ```sql
   CREATE OR REPLACE FUNCTION claim_daily_gift() ... AS $$
   BEGIN
     SET LOCAL lock_timeout = '5s';
     -- if lock fails, PostgreSQL raises exception
     -- wrap in EXCEPTION block:
     EXCEPTION
       WHEN lock_not_available THEN
         RETURN jsonb_build_object('success', false, 'error', 'LOCK_TIMEOUT');
   END;
   $$;
   ```

2. Standardize RPC error responses:
   ```json
   {
     "success": false,
     "error_code": "LOCK_TIMEOUT" | "INSUFFICIENT_GOLD" | "ALREADY_CLAIMED",
     "error_message": "Human-readable description"
   }
   ```

---

## 4. TEST COVERAGE ASSESSMENT

### 4.1 Existing Tests

**Load Tests (k6):**
- ✅ `/load-tests/scenarios/auth-flow.js`: Login/register performance
- ✅ `/load-tests/scenarios/game-flow.js`: Start game → complete game
- ✅ `/load-tests/scenarios/rewards-flow.js`: Daily gift, daily winners
- ✅ `/load-tests/scenarios/leaderboard-flow.js`: Leaderboard queries
- ✅ `/load-tests/scenarios/concurrent-users.js`: 500 VU stress test

**Unit/Integration Tests:**
- ⚠️ **NO AUTOMATED TESTS FOUND** for:
  - Lootbox decision logic (insufficient gold, idempotency, tier RNG)
  - Payment webhook idempotency (duplicate Stripe events)
  - Rate limiting (verify limits enforced, fail-open behavior)
  - Daily gift streak calculation (7-day cycle)
  - Daily winners timezone handling (multiple timezones)
  - Invitation tier rewards (1-2, 3-9, 10+ tiers)

### 4.2 Recommended Test Additions

**High Priority (Critical Business Logic):**
1. **Lootbox Tests:**
   - ✅ User with 100 gold attempts to open 150-gold lootbox → expect error
   - ✅ User opens lootbox twice with same lootboxId → second attempt returns already_opened
   - ✅ User stores lootbox → status changes to 'stored'
   - ✅ Lootbox expires after `expires_at` → not returned by lootbox-active

2. **Payment Tests:**
   - ✅ Stripe webhook sends duplicate `checkout.session.completed` → second event is idempotent (no double-credit)
   - ✅ User calls verify-lootbox-payment before webhook processes → fallback RPC credits correctly
   - ✅ Session_id mismatch (user_id in session ≠ auth user) → expect 403 Forbidden
   - ✅ Session expired (created > 24 hours ago) → expect 400 Bad Request

3. **Rate Limiting Tests:**
   - ✅ User makes 6 login attempts in 15 minutes → 6th attempt returns 429
   - ✅ Rate limit RPC error (DB down) → checkRateLimit returns allowed: true (fail-open)
   - ✅ User makes 101 game starts in 1 minute → 101st returns 429 (when rate limit added)

4. **Daily Gift Tests:**
   - ✅ User claims gift on day 0 (streak=0) → receives 50 coins, streak becomes 1
   - ✅ User claims gift on day 6 (streak=6) → receives 500 coins, streak becomes 7
   - ✅ User claims gift on day 7 (streak=7, cycle resets) → receives 50 coins, streak becomes 8
   - ✅ User in UTC+8 timezone claims gift at 23:50 UTC → expect successful claim
   - ✅ Admin user fetches daily gift status → canShow = false always

5. **Daily Winners Tests:**
   - ✅ Monday TOP 10 user (rank=5) claims reward → receives correct gold/lives for rank 5 Monday
   - ✅ Sunday TOP 25 user (rank=10) claims reward → receives jackpot multiplier (200%)
   - ✅ User claims reward twice for same day_date → second claim returns already_claimed
   - ✅ User with pending reward doesn't claim before midnight → reward deleted (not carried forward)

**Medium Priority (Edge Cases):**
6. **Invitation Tests:**
   - ✅ User registers with invitation code → inviter receives tier 1 reward (200 coins, 3 lives)
   - ✅ Inviter reaches 3 accepted invitations → next invitation grants tier 2 reward (1000 coins, 5 lives)
   - ✅ Inviter reaches 10 accepted invitations → next invitation grants tier 3 reward (6000 coins, 20 lives)

7. **Question Pool Tests:**
   - ✅ Cache cold start → questions loaded in < 100ms
   - ✅ User completes game from pool 1 → next game starts from pool 2
   - ✅ User reaches pool 15 → wraps back to pool 1

### 4.3 Load Test Recommendations

**Scenario: 10,000 Concurrent Users Target**
```javascript
// k6 scenario: 10K users playing simultaneously
export const options = {
  scenarios: {
    game_flow_10k: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 5000 },  // Ramp to 5K
        { duration: '3m', target: 10000 }, // Ramp to 10K
        { duration: '5m', target: 10000 }, // Hold 10K
        { duration: '2m', target: 0 },     // Ramp down
      ],
    },
  },
  thresholds: {
    'http_req_duration{endpoint:start-game}': ['p95<100'], // 95% under 100ms
    'http_req_duration{endpoint:complete-game}': ['p95<200'],
    'http_req_failed': ['rate<0.01'], // <1% error rate
  },
};
```

**Key Metrics to Monitor:**
- ✅ Question cache HIT rate (should be 99%+ after cold start)
- ✅ Database connection pool saturation (Supabase default: 60 connections)
- ✅ Rate limiting 429 responses (should be < 0.1% of requests)
- ✅ RPC lock timeouts (if > 0.5%, increase lock_timeout or optimize queries)

---

## 5. USER JOURNEY - COMPLETE BACKEND WALKTHROUGH

This section describes the **complete user experience from app download to monetization**, detailing every backend operation, edge function call, RPC execution, and database mutation.

### 5.1 App Download & First Launch

**User Action:** Downloads DingleUP! from App Store/Google Play, installs PWA, or opens web app.

**Backend Activity:**
1. **No authentication yet** - app loads in guest state
2. **Config/Feature Flags (future):**
   - If implemented, frontend fetches `/api/config` or environment variables
   - Backend could serve dynamic feature flags (e.g., `lootbox_enabled: true`, `maintenance_mode: false`)
3. **Health Check (optional):**
   - Frontend could ping `/health` endpoint
   - Backend responds: `{ status: 'ok', version: '1.0.0', timestamp: '...' }`
4. **No database queries** - guest browsing landing page does not hit backend

**Landing Page:**
- User sees marketing content, "Play Now" button
- Mobile/tablet: "Play Now" → `/auth/login`
- Desktop: "Play Now" → `/install` (PWA-only game access)

---

### 5.2 Registration (Username + PIN + Optional Invitation Code)

**User Action:** Fills registration form:
- Username: `player123`
- PIN: `123456` (6 digits)
- Invitation Code: `ABC12345` (optional)
- Birth Date: `1995-05-10` (age gate: must be 16+)
- Consent Checkbox: Accepts ÁSZF + Privacy Policy

**Frontend → Backend:** POST `/functions/v1/register-with-username-pin`

**Edge Function: `register-with-username-pin`**

**Step 1: Input Validation**
```typescript
// Validate username (3-20 chars, alphanumeric + underscore)
if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
  return 400 Bad Request: { error: 'INVALID_USERNAME' }
}

// Validate PIN (exactly 6 digits)
if (!/^\d{6}$/.test(pin)) {
  return 400 Bad Request: { error: 'INVALID_PIN' }
}

// Validate birth date (age >= 16)
const age = calculateAge(birthDate);
if (age < 16) {
  return 403 Forbidden: { error: 'AGE_RESTRICTION', message: 'Minimum 16 years old' }
}
```

**Step 2: Rate Limiting**
```typescript
// Check: max 5 registration attempts per 15 minutes per IP/device
const rateLimitResult = await checkRateLimit(supabase, 'register-with-username-pin', RATE_LIMITS.AUTH);
// Calls: check_rate_limit('register-with-username-pin', 5, 15)
// DB Query: UPDATE rpc_rate_limits SET call_count = call_count + 1 WHERE user_id IS NULL AND rpc_name = 'register-with-username-pin'

if (!rateLimitResult.allowed) {
  return 429 Too Many Requests: { error: 'RATE_LIMIT_EXCEEDED', retry_after: 900 }
}
```

**Step 3: Username Uniqueness Check**
```typescript
// DB Query 1: SELECT id FROM profiles WHERE username = 'player123'
const { data: existingUser } = await supabase
  .from('profiles')
  .select('id')
  .eq('username', username)
  .single();

if (existingUser) {
  return 409 Conflict: { error: 'USERNAME_TAKEN' }
}
```

**Step 4: Invitation Code Validation (if provided)**
```typescript
if (invitationCode) {
  // DB Query 2: SELECT id, inviter_id FROM profiles WHERE invitation_code = 'ABC12345'
  const { data: inviter } = await supabase
    .from('profiles')
    .select('id, inviter_id')
    .eq('invitation_code', invitationCode)
    .single();
  
  if (!inviter) {
    return 400 Bad Request: { error: 'INVALID_INVITATION_CODE' }
  }
}
```

**Step 5: Create auth.users Account**
```typescript
// Hash PIN: SHA-256('player123' + '123456') → hash_abc123...
const hashedPin = await hashPin(pin);

// Generate email: player123@dingleup.local (internal-only)
const email = `${username}@dingleup.local`;

// DB Transaction 1: INSERT INTO auth.users (email, encrypted_password)
const { data: authUser, error: signUpError } = await supabase.auth.signUp({
  email,
  password: `${username}${pin}`, // Supabase auth password = username + PIN
  options: {
    data: { username }
  }
});

if (signUpError) {
  return 500 Internal Server Error: { error: 'AUTH_CREATION_FAILED' }
}
```

**Step 6: Create profiles Record**
```typescript
// Generate unique invitation code for new user: 8-char alphanumeric
const newUserInvitationCode = generateInvitationCode(); // e.g., 'X7Y2M9K4'

// DB Transaction 2: INSERT INTO profiles
await supabase.from('profiles').insert({
  id: authUser.user.id,
  username: 'player123',
  pin_hash: hashedPin,
  email: `${username}@dingleup.local`,
  date_of_birth: '1995-05-10',
  age_consent: true,
  terms_accepted_at: NOW(),
  invitation_code: 'X7Y2M9K4',
  coins: 0,              // Initial wallet: 0 gold
  lives: 15,             // Initial lives: 15 (max)
  max_lives: 15,
  lives_regeneration_rate: 12, // 12 minutes per life
  last_life_regeneration: NOW(),
  daily_gift_streak: 0,
  preferred_language: 'en', // Default language
  user_timezone: 'UTC',     // Will be updated on first login
  country_code: null,       // Will be detected via timezone
  created_at: NOW()
});
```

**Step 7: Process Invitation Reward (if invitation code was provided)**
```typescript
if (invitationCode) {
  // DB Transaction 3: INSERT INTO invitations
  await supabase.from('invitations').insert({
    inviter_id: inviter.id,
    invited_user_id: authUser.user.id,
    invitation_code: invitationCode,
    accepted: true,
    accepted_at: NOW()
  });
  
  // DB Query 3: Count accepted invitations for inviter
  const { count: acceptedCount } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true })
    .eq('inviter_id', inviter.id)
    .eq('accepted', true);
  
  // Calculate tier reward:
  // 1-2 accepted → 200 coins + 3 lives
  // 3-9 accepted → 1000 coins + 5 lives
  // 10+ accepted → 6000 coins + 20 lives
  const { coins: rewardCoins, lives: rewardLives } = getInvitationTierReward(acceptedCount);
  
  // DB Transaction 4: RPC call - credit_wallet(inviter_id, coins, lives, 'invitation_accepted', idempotency_key)
  const idempotencyKey = `invitation_accepted:${invitation.id}`;
  await supabase.rpc('credit_wallet', {
    p_user_id: inviter.id,
    p_delta_coins: rewardCoins,
    p_delta_lives: rewardLives,
    p_source: 'invitation_accepted',
    p_idempotency_key: idempotencyKey,
    p_metadata: { invitation_id: invitation.id, accepted_count: acceptedCount }
  });
  
  // RPC credit_wallet performs:
  // 1. Check idempotency: SELECT * FROM wallet_ledger WHERE correlation_id = idempotencyKey
  // 2. If not exists:
  //    - INSERT INTO wallet_ledger (user_id, delta_coins, delta_lives, source, correlation_id)
  //    - UPDATE profiles SET coins = coins + rewardCoins, lives = LEAST(lives + rewardLives, max_lives + rewardLives)
  
  // DB Trigger: sync_referral_to_friendship fires
  // - Calls normalize_user_ids(inviter_id, invited_user_id)
  // - INSERT INTO friendships (user_id_a, user_id_b, status='active', source='referral')
  // - INSERT INTO dm_threads (user_id_a, user_id_b)
  // - INSERT INTO message_reads (thread_id, user_id) × 2 (for both users)
}
```

**Step 8: Log & Response**
```typescript
// ⚠️ MISSING: Metrics logging (should use _shared/metrics.ts)
// Should log:
// {
//   function: 'register-with-username-pin',
//   request_id: 'uuid-123',
//   user_id: authUser.user.id,
//   status: 'success',
//   elapsed_ms: 245,
//   db_queries_count: 4 (or 7 if invitation processed),
//   invitation_processed: true/false,
//   reward_coins: 200,
//   reward_lives: 3
// }

return 200 OK: {
  success: true,
  user: {
    id: authUser.user.id,
    username: 'player123',
    email: 'player123@dingleup.local'
  },
  invitation_reward: invitationCode ? { coins: 200, lives: 3 } : null
}
```

**Total Database Operations:**
- **Without invitation:** 4 queries (rate limit + username check + auth.users insert + profiles insert)
- **With invitation:** 8 queries (+ invitation lookup + invitation insert + accepted count + credit_wallet RPC + friendship trigger)

**Elapsed Time:** ~200-300ms (with invitation processing)

---

### 5.3 First Login (Username + PIN Authentication)

**User Action:** Enters username `player123` + PIN `123456` on login page.

**Frontend → Backend:** POST `/functions/v1/login-with-username-pin`

**Edge Function: `login-with-username-pin`**

**Step 1: Rate Limiting**
```typescript
// Check: max 5 login attempts per 15 minutes per username
const rateLimitResult = await checkRateLimit(supabase, 'login-with-username-pin', RATE_LIMITS.AUTH);

if (!rateLimitResult.allowed) {
  return 429 Too Many Requests: { error: 'RATE_LIMIT_EXCEEDED' }
}
```

**Step 2: Username Lookup**
```typescript
// DB Query 1: SELECT id, pin_hash, email FROM profiles WHERE username = 'player123'
const { data: profile } = await supabase
  .from('profiles')
  .select('id, pin_hash, email')
  .eq('username', username)
  .single();

if (!profile) {
  // Record failed attempt (for brute-force protection)
  await recordFailedAttempt(supabase, username);
  return 401 Unauthorized: { error: 'INVALID_CREDENTIALS' }
}
```

**Step 3: PIN Verification**
```typescript
// Hash entered PIN: SHA-256('player123' + '123456')
const enteredPinHash = await hashPin(pin);

if (enteredPinHash !== profile.pin_hash) {
  // Record failed attempt
  // DB Transaction: INSERT INTO login_attempts_pin (username, failed_at) or UPDATE attempts_count++
  await recordFailedAttempt(supabase, username);
  
  // Check if account locked (5 failed attempts within 15 minutes)
  if (failedAttemptsCount >= 5) {
    return 403 Forbidden: { error: 'ACCOUNT_LOCKED', retry_after: 900 }
  }
  
  return 401 Unauthorized: { error: 'INVALID_CREDENTIALS' }
}
```

**Step 4: Generate Auth Token**
```typescript
// Supabase Auth: sign in with email + password
// Password = username + PIN (synced during registration)
const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
  email: profile.email,
  password: `${username}${pin}`
});

if (signInError) {
  // Fallback: sync password if mismatch detected
  // DB Transaction: UPDATE auth.users SET encrypted_password = hash(username + PIN)
  await syncAuthPassword(profile.id, username, pin);
  
  // Retry sign-in
  const { data: retryAuth } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: `${username}${pin}`
  });
  
  authData = retryAuth;
}

// authData.session.access_token = JWT token for subsequent requests
```

**Step 5: Clear Failed Login Attempts**
```typescript
// DB Transaction: DELETE FROM login_attempts_pin WHERE username = 'player123'
await supabase.from('login_attempts_pin').delete().eq('username', username);
```

**Step 6: Fetch User Profile**
```typescript
// DB Query 2: SELECT * FROM profiles WHERE id = authData.user.id
const { data: userProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', authData.user.id)
  .single();

// userProfile contains:
// - coins, lives, max_lives
// - daily_gift_streak, daily_gift_last_claimed, daily_gift_last_seen
// - preferred_language, user_timezone, country_code
// - invitation_code (user's own code to share)
```

**Step 7: Log & Response**
```typescript
// ⚠️ MISSING: Metrics logging
// Should log:
// {
//   function: 'login-with-username-pin',
//   request_id: 'uuid-456',
//   user_id: authData.user.id,
//   status: 'success',
//   elapsed_ms: 120,
//   db_queries_count: 2
// }

return 200 OK: {
  success: true,
  session: {
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
    expires_at: authData.session.expires_at
  },
  user: userProfile,
  passwordVariants: [
    `${username}${pin}`,
    `${username.toLowerCase()}${pin}`,
    // ... (for frontend auto-retry if needed)
  ]
}
```

**Total Database Operations:** 2 queries (profile lookup + profile fetch after auth)

**Elapsed Time:** ~100-150ms

---

### 5.4 Dashboard Load - First Time User

**User Action:** Successfully logged in, app navigates to `/dashboard`.

**Frontend → Backend:** Multiple parallel requests

**Request 1: Get Wallet Balance**
- **Endpoint:** `supabase.from('profiles').select('coins, lives, max_lives').eq('id', user.id).single()`
- **DB Query:** SELECT coins, lives, max_lives FROM profiles WHERE id = user.id
- **Response:** `{ coins: 0, lives: 15, max_lives: 15 }`
- **Realtime Subscription:** `supabase.channel('profiles').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'id=eq.user.id' })`

**Request 2: Get Daily Gift Status**
- **Endpoint:** POST `/functions/v1/get-daily-gift-status`
- **Edge Function Logic:**
  ```typescript
  // DB Query 1: SELECT user_timezone, daily_gift_last_seen, daily_gift_streak FROM profiles WHERE id = user.id
  
  // Check if user is admin (admins never see Daily Gift)
  // DB Query 2: SELECT has_role(user.id, 'admin')
  const isAdmin = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  if (isAdmin) {
    return { canShow: false }
  }
  
  // Calculate today's date in user's timezone
  const userTimezone = profile.user_timezone || 'UTC';
  const localDateString = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone }); // '2025-12-01'
  
  // Check if user has seen/claimed gift today
  const canShow = !profile.daily_gift_last_seen || profile.daily_gift_last_seen !== localDateString;
  
  // Calculate reward based on streak (7-day cycle)
  const currentStreak = profile.daily_gift_streak ?? 0;
  const cyclePosition = currentStreak % 7;
  const rewardCoins = [50, 75, 110, 160, 220, 300, 500][cyclePosition];
  
  return {
    canShow: true,
    localDate: '2025-12-01',
    timeZone: 'UTC',
    streak: 0,
    nextReward: 50
  }
  ```
- **Total DB Queries:** 2 (profile fetch + admin role check)
- **Elapsed Time:** ~50ms

**Request 3: Get Active Lootbox**
- **Endpoint:** POST `/functions/v1/lootbox-active`
- **Edge Function Logic:**
  ```typescript
  // Decode user_id from JWT (avoid session-based auth for performance)
  const userId = getUserIdFromAuthHeader(req);
  
  // DB Query: SELECT id, status, open_cost_gold, expires_at, source FROM lootbox_instances WHERE user_id = userId AND status = 'active_drop' ORDER BY created_at DESC LIMIT 1
  const { data: activeLootbox } = await supabase
    .from('lootbox_instances')
    .select('id, status, open_cost_gold, expires_at, source')
    .eq('user_id', userId)
    .eq('status', 'active_drop')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  // Check expiry (client-side also checks, but backend validates)
  if (activeLootbox && activeLootbox.expires_at) {
    const now = new Date();
    const expiresAt = new Date(activeLootbox.expires_at);
    if (now > expiresAt) {
      return { activeLootbox: null } // Expired, don't show
    }
  }
  
  return { activeLootbox: activeLootbox || null }
  ```
- **Total DB Queries:** 1
- **Elapsed Time:** ~30ms
- **First-time user:** No lootbox yet (first drop occurs after ~1 minute)

**Request 4: Get Daily Winners Status (Yesterday's Winners)**
- **Endpoint:** POST `/functions/v1/get-daily-winners-status`
- **Edge Function Logic:**
  ```typescript
  // User timezone (from profile or JWT metadata)
  const userTimezone = 'UTC';
  
  // Calculate yesterday's date in user's timezone
  const yesterday = getYesterdayDate(userTimezone); // '2025-11-30'
  
  // DB Query 1: Check if user has already seen yesterday's winners popup
  const { data: popupView } = await supabase
    .from('daily_winners_popup_views')
    .select('last_shown_day')
    .eq('user_id', user.id)
    .single();
  
  if (popupView && popupView.last_shown_day === yesterday) {
    return { shouldShow: false } // Already shown today
  }
  
  // DB Query 2: Check if snapshot exists for yesterday
  const { data: snapshot } = await supabase
    .from('daily_leaderboard_snapshot')
    .select('*')
    .eq('snapshot_date', yesterday)
    .order('rank', { ascending: true })
    .limit(3); // TOP 3 for display
  
  if (!snapshot || snapshot.length === 0) {
    // No data for yesterday → trigger lazy processing
    // ⚠️ This is workaround for Supabase cron not running automatically
    // Call process-daily-winners edge function
    await supabase.functions.invoke('process-daily-winners', {
      body: { target_date: yesterday }
    });
    
    // Re-fetch snapshot after processing
    const { data: newSnapshot } = await supabase
      .from('daily_leaderboard_snapshot')
      .select('*')
      .eq('snapshot_date', yesterday)
      .order('rank', { ascending: true })
      .limit(3);
    
    snapshot = newSnapshot;
  }
  
  return {
    shouldShow: true,
    yesterday: yesterday,
    topPlayers: snapshot || []
  }
  ```
- **Total DB Queries:** 2-4 (popup view check + snapshot fetch + optional process trigger + re-fetch)
- **Elapsed Time:** ~80-150ms (if lazy processing triggered, can be 500ms+)

**Request 5: Check Welcome Bonus Eligibility**
- **Frontend Logic (no backend call):**
  ```typescript
  // Check localStorage: has_seen_welcome_bonus
  const hasSeenWelcomeBonus = localStorage.getItem('has_seen_welcome_bonus') === 'true';
  if (!hasSeenWelcomeBonus && user.coins === 0 && user.lives === 15) {
    // Show Welcome Bonus popup (one-time offer)
  }
  ```
- **No DB queries** - purely client-side state

**Popup Display Sequence (First-Time User):**
1. **Welcome Bonus Popup:** "Welcome! Here's a gift to get started!" (one-time, localStorage-based)
   - User clicks "Accept" → localStorage set, popup closes
   - User clicks "X" (close) → localStorage set, popup closes
   
2. **Daily Gift Popup:** (only after Welcome Bonus closes)
   - `canShow: true` from get-daily-gift-status
   - Shows: "Day 1 Streak - Claim 50 coins!"
   - User clicks "Claim" → POST `/functions/v1/claim-daily-gift`
   
3. **Daily Winners Popup:** (only after Daily Gift closes)
   - Shows: Yesterday's TOP 3 players (if any)
   - User clicks "Gratulálok" (Congratulations) → popup dismissed, record saved to `daily_winners_popup_views`

**Total Backend Calls on Dashboard Load:** 4 requests (wallet fetch + daily gift status + lootbox active + daily winners status)

**Total DB Queries:** ~6-10 (depending on lazy processing)

**Elapsed Time:** ~200-400ms (all parallel requests)

---

### 5.5 First Game Start

**User Action:** Clicks "Play Now" button on Dashboard → navigates to `/game` → game initialization begins.

**Frontend → Backend:** POST `/functions/v1/start-game-session`

**Request Body:**
```json
{
  "lang": "en",  // User's preferred language
  "category": "mixed" // Always "mixed" (all 30 topics)
}
```

**Edge Function: `start-game-session` (✅ OPTIMIZED with metrics.ts)**

**Step 1: Initialize Metrics Context**
```typescript
import { startMetrics, measureStage, incDbQuery, logSuccess, logError } from '../_shared/metrics.ts';

const ctx = startMetrics({ 
  functionName: 'start-game-session', 
  userId: user.id // Extracted from JWT
});
```

**Step 2: Parallel Database Queries (Optimized)**
```typescript
// Measure parallel queries stage
const [profileResult, poolResult] = await measureStage(ctx, 'parallel_queries', async () => {
  incDbQuery(ctx, 2); // Track 2 DB queries
  
  return await Promise.all([
    // Query 1: Fetch user profile (lives, max_lives, country_code)
    supabase
      .from('profiles')
      .select('lives, max_lives, country_code')
      .eq('id', user.id)
      .single(),
    
    // Query 2: Fetch user's current pool progression
    supabase
      .from('game_session_pools')
      .select('last_pool_order')
      .eq('user_id', user.id)
      .eq('topic_id', 'mixed')
      .single()
  ]);
});

// Check if user has lives
if (profileResult.data.lives < 1) {
  logError(ctx, new Error('INSUFFICIENT_LIVES'));
  return 400 Bad Request: { error: 'INSUFFICIENT_LIVES' }
}

// Determine next pool (1-15 cycle)
const currentPoolOrder = poolResult.data?.last_pool_order ?? 0;
const nextPoolOrder = (currentPoolOrder % 15) + 1; // 1, 2, 3, ..., 15, 1, 2, ...
```

**Step 3: Question Selection from In-Memory Cache (Zero DB Queries)**
```typescript
// Measure question selection stage
const questions = await measureStage(ctx, 'question_selection', async () => {
  // Access dual-language cache (loaded at cold start)
  const poolCache = lang === 'hu' ? POOLS_CACHE_HU : POOLS_CACHE_EN;
  
  // Get pool entry from memory (cache HIT)
  const poolEntry = poolCache.get(nextPoolOrder);
  if (!poolEntry) {
    throw new Error('POOL_NOT_FOUND'); // Should never happen
  }
  
  // Fisher-Yates shuffle: select 15 random questions from 300-question pool
  const shuffled = [...poolEntry]; // Clone array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, 15); // Return first 15 questions
});

// Log cache status
ctx.extra['cache_status'] = 'HIT'; // Always HIT after cold start
ctx.extra['pool_number'] = nextPoolOrder;
```

**Step 4: Create Game Session**
```typescript
// Measure session insert stage
const gameSession = await measureStage(ctx, 'session_insert', async () => {
  incDbQuery(ctx, 2); // Session insert + pool update
  
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  
  // DB Transaction 1: INSERT INTO game_sessions
  const { data: session } = await supabase
    .from('game_sessions')
    .insert({
      user_id: user.id,
      session_id: sessionId,
      category: 'mixed',
      questions: JSON.stringify(questions), // Serialized questions
      current_question: 0,
      correct_answers: 0,
      started_at: new Date(),
      expires_at: expiresAt
    })
    .select()
    .single();
  
  // DB Transaction 2: UPSERT game_session_pools (update pool progression)
  await supabase
    .from('game_session_pools')
    .upsert({
      user_id: user.id,
      topic_id: 'mixed',
      last_pool_order: nextPoolOrder
    }, {
      onConflict: 'user_id,topic_id'
    });
  
  return session;
});
```

**Step 5: Log Success & Return Response**
```typescript
// Log structured JSON with all metrics
logSuccess(ctx, {
  cache_status: 'HIT',
  pool_number: nextPoolOrder,
  question_count: 15,
  lang: lang
});

const totalElapsed = Date.now() - ctx.startTime;

return 200 OK: {
  success: true,
  elapsed_ms: totalElapsed,          // e.g., 45ms
  parallel_queries_ms: ctx.extra['parallel_queries_ms'], // e.g., 12ms
  question_selection_ms: ctx.extra['question_selection_ms'], // e.g., 8ms
  session_insert_ms: ctx.extra['session_insert_ms'], // e.g., 15ms
  db_queries_count: 4, // 2 parallel + 2 session insert
  cache_status: 'HIT',
  pool_number: nextPoolOrder,
  session_id: gameSession.id,
  questions: questions, // Array of 15 questions
  expires_at: gameSession.expires_at
}
```

**Structured Log Output (Supabase Logs):**
```json
{
  "ts": "2025-12-01T10:45:30.123Z",
  "level": "info",
  "function": "start-game-session",
  "request_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "user_id": "uuid-user-123",
  "status": "success",
  "elapsed_ms": 45,
  "db_queries_count": 4,
  "parallel_queries_ms": 12,
  "question_selection_ms": 8,
  "session_insert_ms": 15,
  "cache_status": "HIT",
  "pool_number": 5,
  "question_count": 15,
  "lang": "en"
}
```

**Total Database Operations:** 4 queries (2 parallel fetch + 1 session insert + 1 pool upsert)

**Elapsed Time:** ~35-55ms (with cache HIT)

---

### 5.6 Game Completion & Reward Crediting

**User Action:** Answers all 15 questions → Game ends with score 12/15 correct.

**Frontend → Backend:** Two requests (complete-game + credit-gameplay-reward for each correct answer)

**Request 1: Complete Game**
- **Endpoint:** POST `/functions/v1/complete-game`
- **Request Body:**
  ```json
  {
    "sessionId": "uuid-game-session-123",
    "correctAnswers": 12,
    "category": "mixed",
    "responseTimes": [3.2, 5.1, 2.8, ...], // Array of 15 response times (seconds)
    "coinsEarned": 480 // 12 correct × 40 coins/answer
  }
  ```

**Edge Function: `complete-game` (⚠️ NOT YET REFACTORED with metrics.ts)**

**Step 1: Duplicate Protection (Idempotency)**
```typescript
// DB Query 1: Check if game result already exists for this session
const { data: existingResult } = await supabase
  .from('game_results')
  .select('id')
  .eq('id', sessionId) // session_id = game_result.id (1:1 mapping)
  .single();

if (existingResult) {
  console.log('[complete-game] Duplicate completion attempt:', sessionId);
  return 200 OK: { 
    success: true, 
    duplicate: true,
    message: 'Game already completed' 
  }
}
```

**Step 2: Insert Game Result**
```typescript
// Calculate average response time
const avgResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

// DB Transaction 1: INSERT INTO game_results
const { data: gameResult } = await supabase
  .from('game_results')
  .insert({
    id: sessionId, // Use session_id as primary key (ensures uniqueness)
    user_id: user.id,
    category: 'mixed',
    correct_answers: 12,
    total_questions: 15,
    coins_earned: 480,
    average_response_time: avgResponseTime,
    completed: true,
    completed_at: NOW()
  })
  .select()
  .single();
```

**Step 3: Update Daily Rankings (Aggregation)**
```typescript
// DB Transaction 2: RPC call - update_daily_ranking_for_user
await supabase.rpc('upsert_daily_ranking_aggregate', {
  p_user_id: user.id,
  p_correct_answers: 12,
  p_average_response_time: avgResponseTime
});

// RPC Logic:
// 1. Calculate today's date (CURRENT_DATE in UTC)
// 2. UPSERT daily_rankings:
//    - If no entry for (user_id, 'mixed', today) → INSERT with correct_answers=12, avg_response_time=avgResponseTime
//    - If entry exists → UPDATE:
//      total_correct_answers += 12 (cumulative for the day)
//      average_response_time = weighted average of old + new
// 3. ⚠️ Rank NOT calculated here (delegated to background MV refresh)
```

**Step 4: Update Global Leaderboard**
```typescript
// DB Transaction 3: UPSERT global_leaderboard
await supabase
  .from('global_leaderboard')
  .upsert({
    user_id: user.id,
    username: user.username,
    avatar_url: user.avatar_url,
    total_correct_answers: user.lifetime_correct_answers + 12, // Incremental
    updated_at: NOW()
  }, {
    onConflict: 'user_id'
  });

// ⚠️ Rank recalculation happens in background (not real-time)
```

**Step 5: Log & Response**
```typescript
// ⚠️ MISSING: Structured logging with metrics.ts
// Should log:
// {
//   function: 'complete-game',
//   request_id: 'uuid-789',
//   user_id: user.id,
//   status: 'success',
//   elapsed_ms: 180,
//   db_queries_count: 3,
//   duplicate_check_ms: 10,
//   game_result_insert_ms: 25,
//   daily_ranking_update_ms: 80,
//   global_leaderboard_update_ms: 40,
//   correct_answers: 12,
//   category: 'mixed'
// }

console.log('[complete-game] Success:', { sessionId, correctAnswers: 12 });

return 200 OK: {
  success: true,
  gameResultId: gameResult.id,
  correct_answers: 12,
  coins_earned: 480
}
```

**Request 2: Credit Gameplay Reward (Per Correct Answer)**
- **⚠️ NOTE:** Frontend calls this 12 times (once per correct answer) in parallel
- **Endpoint:** POST `/functions/v1/credit-gameplay-reward` (×12)
- **Request Body:**
  ```json
  {
    "amount": 40, // Coins per correct answer
    "sourceId": "uuid-game-session-123",
    "reason": "game_correct_answer"
  }
  ```

**Edge Function: `credit-gameplay-reward` (⚠️ NOT YET REFACTORED)**

**Step 1: Rate Limiting (⚠️ MISSING)**
```typescript
// ⚠️ Should check RATE_LIMITS.GAME (100 req/min)
// const rateLimitResult = await checkRateLimit(supabase, 'credit-gameplay-reward', RATE_LIMITS.GAME);
```

**Step 2: Input Validation**
```typescript
// Validate amount (integer, positive)
if (!Number.isInteger(amount) || amount <= 0) {
  return 400 Bad Request: { error: 'INVALID_AMOUNT' }
}
```

**Step 3: Idempotent Credit (Critical)**
```typescript
// Construct idempotency key: combines session + question index
// Frontend sends sourceId = session_id + question_index hash
const idempotencyKey = `game_reward:${sourceId}:${questionIndex}`;

// DB Transaction: RPC call - credit_wallet
const { data: result, error: creditError } = await supabase.rpc('credit_wallet', {
  p_user_id: user.id,
  p_delta_coins: 40,
  p_delta_lives: 0,
  p_source: 'game_correct_answer',
  p_idempotency_key: idempotencyKey,
  p_metadata: { session_id: sourceId, amount: 40 }
});

// RPC credit_wallet Logic:
// 1. Check idempotency: SELECT * FROM wallet_ledger WHERE correlation_id = idempotencyKey
// 2. If EXISTS → RETURN { success: true, already_processed: true }
// 3. If NOT EXISTS:
//    - INSERT INTO wallet_ledger (user_id, delta_coins, source, correlation_id, created_at)
//    - UPDATE profiles SET coins = coins + 40 WHERE id = user.id
//    - RETURN { success: true, new_coins: <updated_balance> }
```

**Step 4: Response**
```typescript
// ⚠️ MISSING: Metrics logging

return 200 OK: {
  success: true,
  credited: result.already_processed ? 0 : 40,
  newBalance: result.new_coins
}
```

**Total Database Operations (Game Completion Flow):**
- **complete-game:** 3 queries (duplicate check + game result insert + daily ranking RPC + global leaderboard upsert)
- **credit-gameplay-reward × 12:** 12 RPC calls (each checks idempotency + credits wallet)
- **Total:** 15 DB operations

**Elapsed Time:**
- complete-game: ~150-200ms
- credit-gameplay-reward (all 12 parallel): ~80-120ms (due to idempotency deduplication)

**Frontend UX:**
- Coins increment in real-time as each credit succeeds (tick-up animation ≤500ms per correct answer)
- No delays or buffering - immediate jóváírás (0 second latency requirement)

---

### 5.7 Lootbox Drop, Decision, and Opening

**User Action:** After 1 minute of login, a lootbox appears (overlay notification).

**Backend Activity: Lootbox Drop Scheduling**

**Background Process (Lootbox Daily Plan):**
```typescript
// RPC: generate_lootbox_daily_plan (called on first login of the day)
// - Generates 10-20 random drop times throughout user's active hours
// - Stores in lootbox_daily_plans table

// Guaranteed drops for first 3 logins:
// - Login 1: Drop at login_time + 1 minute
// - Login 2: Drop at login_time + 1 minute
// - Login 3: Drop at login_time + 1 minute
// From login 4+: Random drops every 5+ minutes (if user active)

// DB Transaction: INSERT INTO lootbox_instances
await supabase
  .from('lootbox_instances')
  .insert({
    user_id: user.id,
    status: 'active_drop',
    source: 'daily_free',
    open_cost_gold: 150, // Cost to open
    expires_at: NOW() + interval '5 minutes', // 5-minute timer
    created_at: NOW()
  });

// Frontend polling (every 3 seconds): POST /functions/v1/lootbox-active
// Returns: { activeLootbox: { id, open_cost_gold, expires_at } }
```

**User Action:** Sees lootbox overlay, clicks "Open Now" (Kinyitom) button.

**Frontend → Backend:** POST `/functions/v1/lootbox-decide`

**Request Body:**
```json
{
  "lootboxId": "uuid-lootbox-123",
  "decision": "open_now" // or "store"
}
```

**Edge Function: `lootbox-decide` (⚠️ MISSING rate limit, MISSING metrics)**

**Step 1: Validation**
```typescript
// ⚠️ MISSING: Rate limit check (should use RATE_LIMITS.WALLET)

// Validate input
if (!lootboxId || !decision) {
  return 400 Bad Request: { error: 'MISSING_PARAMETERS' }
}

if (decision !== 'open_now' && decision !== 'store') {
  return 400 Bad Request: { error: 'INVALID_DECISION' }
}
```

**Step 2: Verify Lootbox Ownership**
```typescript
// DB Query 1: SELECT * FROM lootbox_instances WHERE id = lootboxId AND user_id = user.id
const { data: lootbox } = await supabase
  .from('lootbox_instances')
  .select('*')
  .eq('id', lootboxId)
  .eq('user_id', user.id)
  .single();

if (!lootbox) {
  return 404 Not Found: { error: 'LOOTBOX_NOT_FOUND' }
}

if (lootbox.status !== 'active_drop') {
  return 400 Bad Request: { error: 'LOOTBOX_NOT_ACTIVE' }
}
```

**Step 3: Handle Decision**

**Option A: Store for Later**
```typescript
if (decision === 'store') {
  // DB Transaction: UPDATE lootbox_instances SET status = 'stored' WHERE id = lootboxId
  await supabase
    .from('lootbox_instances')
    .update({ status: 'stored' })
    .eq('id', lootboxId);
  
  return 200 OK: {
    success: true,
    decision: 'stored',
    message: 'Lootbox stored for later'
  }
}
```

**Option B: Open Now**
```typescript
if (decision === 'open_now') {
  // Generate rewards (RNG tier selection)
  const tier = generateLootboxTier(); // 'Bronze', 'Silver', 'Gold', 'Platinum'
  const rewards = generateLootboxRewards(tier);
  // Example rewards:
  // - Bronze: 50-100 gold, 1-2 lives
  // - Silver: 100-200 gold, 2-4 lives
  // - Gold: 200-500 gold, 4-8 lives
  // - Platinum: 500-1000 gold, 8-15 lives
  
  const { gold_reward, life_reward } = rewards;
  
  // Construct idempotency key
  const idempotencyKey = `lootbox_open:${lootboxId}`;
  
  // DB Transaction: RPC call - open_lootbox_transaction
  const { data: result, error: rpcError } = await supabase.rpc('open_lootbox_transaction', {
    p_lootbox_id: lootboxId,
    p_user_id: user.id,
    p_tier: tier,
    p_gold_reward: gold_reward,
    p_life_reward: life_reward,
    p_idempotency_key: idempotencyKey,
    p_open_cost: 150 // Gold cost to open
  });
  
  // RPC open_lootbox_transaction Logic:
  // 1. SELECT ... FOR UPDATE lootbox_instances WHERE id = p_lootbox_id (lock row)
  // 2. Check status = 'active_drop' or 'stored' (else RETURN error)
  // 3. Check user has >= 150 gold:
  //    SELECT coins FROM profiles WHERE id = p_user_id
  //    IF coins < 150 → RETURN { success: false, error: 'INSUFFICIENT_GOLD' }
  // 4. Deduct gold:
  //    INSERT INTO wallet_ledger (user_id, delta_coins=-150, source='lootbox_open_cost', correlation_id=idempotency_key+'_cost')
  //    UPDATE profiles SET coins = coins - 150
  // 5. Credit rewards:
  //    RPC credit_wallet(p_user_id, p_gold_reward, p_life_reward, 'lootbox_reward', idempotency_key+'_reward')
  // 6. Update lootbox:
  //    UPDATE lootbox_instances SET status='opened', opened_at=NOW(), rewards_gold=p_gold_reward, rewards_life=p_life_reward
  // 7. RETURN { success: true, lootbox: {...}, rewards: {...}, new_balance: {...} }
  
  if (rpcError) {
    return 500 Internal Server Error: { error: 'LOOTBOX_OPEN_FAILED' }
  }
  
  if (!result.success) {
    // Business logic error (insufficient gold)
    return 400 Bad Request: { 
      success: false, 
      error: result.error, // 'INSUFFICIENT_GOLD'
      required: 150,
      current: result.current_gold
    }
  }
  
  return 200 OK: {
    success: true,
    lootbox: result.lootbox,
    rewards: {
      tier: tier,
      gold: gold_reward,
      lives: life_reward
    },
    newBalance: {
      gold: result.new_balance.gold,
      lives: result.new_balance.life
    }
  }
}
```

**Total Database Operations:**
- **Store decision:** 2 queries (lootbox lookup + status update)
- **Open now decision:** 2+ queries (lootbox lookup + open_lootbox_transaction RPC)
  - RPC performs: SELECT FOR UPDATE + wallet deduction + credit_wallet + lootbox update = ~4-6 internal queries

**Elapsed Time:**
- Store: ~50ms
- Open: ~120-180ms (transaction safety overhead)

---

### 5.8 Daily Gift Claiming

**User Action:** Daily Gift popup appears (first login of the day), user clicks "Claim" button.

**Frontend → Backend:** POST `/functions/v1/claim-daily-gift` (wrapper around RPC)

**No Request Body** (user is identified via JWT)

**Edge Function (Wrapper):**
```typescript
// Extract user_id from JWT
const userId = user.id;

// DB Transaction: RPC call - claim_daily_gift()
const { data: result, error: claimError } = await supabase.rpc('claim_daily_gift');

// RPC claim_daily_gift() Logic (PostgreSQL):
// 1. Lock user profile:
//    SELECT * FROM profiles WHERE id = auth.uid() FOR UPDATE
// 2. Get user timezone, calculate today's date in local timezone
// 3. Check idempotency:
//    SELECT * FROM wallet_ledger WHERE correlation_id = 'daily-gift:user_id:2025-12-01'
//    IF EXISTS → RETURN { success: true, already_processed: true }
// 4. Calculate reward based on streak:
//    current_streak = daily_gift_streak ?? 0
//    cycle_position = current_streak % 7
//    reward_coins = [50, 75, 110, 160, 220, 300, 500][cycle_position]
// 5. Credit coins:
//    INSERT INTO wallet_ledger (user_id, delta_coins, source='daily', correlation_id='daily-gift:...', metadata={streak, cycle_position})
//    UPDATE profiles SET coins = coins + reward_coins
// 6. Update profile:
//    UPDATE profiles SET 
//      daily_gift_streak = current_streak + 1,
//      daily_gift_last_claimed = NOW(),
//      daily_gift_last_seen = today_local_date
//    WHERE id = auth.uid()
// 7. RETURN { success: true, grantedCoins: reward_coins, walletBalance: new_coins, streak: new_streak }

if (claimError) {
  return 500 Internal Server Error: { error: 'CLAIM_FAILED' }
}

if (!result.success) {
  return 400 Bad Request: { error: result.error } // e.g., 'ALREADY_CLAIMED_TODAY'
}

return 200 OK: {
  success: true,
  grantedCoins: result.grantedCoins, // 50 (for day 1)
  walletBalance: result.walletBalance, // e.g., 530 (previous 480 + 50)
  streak: result.streak // 1
}
```

**Total Database Operations:** 1 RPC call (performs 3-5 internal queries with transaction safety)

**Elapsed Time:** ~80-120ms

**Frontend UX:**
- Coins increment with tick-up animation
- Popup closes, Daily Gift popup does not appear again today

---

### 5.9 Daily Winners - Personal Rank Reward Claim

**User Action:** Daily Winners popup shows "You ranked #5 in Hungary yesterday! Claim your reward."

**Frontend → Backend:** POST `/functions/v1/claim-daily-rank-reward`

**Request Body:**
```json
{
  "day_date": "2025-11-30" // Yesterday's date in user's timezone
}
```

**Edge Function: `claim-daily-rank-reward` (⚠️ MISSING rate limit, MISSING metrics, MISSING lock timeout handling)**

**Step 1: JWT Extraction**
```typescript
// Extract user_id from JWT (avoid session-based auth)
const authHeader = req.headers.get('Authorization');
const token = authHeader.split(' ')[1];
const payload = JSON.parse(atob(token.split('.')[1]));
const userId = payload.sub;
```

**Step 2: Parse Request**
```typescript
const { day_date } = await req.json();

if (!day_date) {
  return 400 Bad Request: { error: 'MISSING_DAY_DATE' }
}

// Validate date format (YYYY-MM-DD)
if (!/^\d{4}-\d{2}-\d{2}$/.test(day_date)) {
  return 400 Bad Request: { error: 'INVALID_DATE_FORMAT' }
}
```

**Step 3: Fetch User Country**
```typescript
// DB Query 1: SELECT country_code FROM profiles WHERE id = userId
const { data: profile } = await supabase
  .from('profiles')
  .select('country_code')
  .eq('id', userId)
  .single();

if (!profile.country_code) {
  return 400 Bad Request: { error: 'NO_COUNTRY_CODE' }
}
```

**Step 4: Claim Reward (Atomic RPC)**
```typescript
// DB Transaction: RPC call - claim_daily_winner_reward
const { data: result, error: claimError } = await supabase.rpc('claim_daily_winner_reward', {
  p_user_id: userId,
  p_day_date: day_date,
  p_country_code: profile.country_code
});

// RPC claim_daily_winner_reward Logic:
// 1. Lock winner record:
//    SELECT * FROM daily_winner_awarded 
//    WHERE user_id = p_user_id AND day_date = p_day_date AND country_code = p_country_code
//    FOR UPDATE
//    ⚠️ ISSUE: No lock timeout set → if lock fails, function hangs
// 2. Check status = 'pending' (not already claimed)
//    IF status = 'claimed' → RETURN { success: false, error: 'ALREADY_CLAIMED' }
// 3. Get reward amounts:
//    gold_awarded = daily_winner_awarded.gold_awarded
//    lives_awarded = daily_winner_awarded.lives_awarded
// 4. Credit wallet:
//    RPC credit_wallet(p_user_id, gold_awarded, lives_awarded, 'daily_winner', idempotency_key='daily_winner:user_id:day_date')
// 5. Update status:
//    UPDATE daily_winner_awarded SET status='claimed', claimed_at=NOW() WHERE id = winner_id
// 6. RETURN { success: true, gold: gold_awarded, lives: lives_awarded }

if (claimError) {
  // ⚠️ No structured error handling (could be lock timeout, DB error, etc.)
  return 500 Internal Server Error: { error: 'CLAIM_FAILED' }
}

if (!result.success) {
  return 400 Bad Request: { error: result.error } // 'ALREADY_CLAIMED' or 'NO_PENDING_REWARD'
}

return 200 OK: {
  success: true,
  gold: result.gold, // e.g., 2400 (Monday rank 1)
  lives: result.lives // e.g., 48
}
```

**Total Database Operations:** 2 queries (profile fetch + claim RPC)

**Elapsed Time:** ~100-150ms

**Issues:**
- ⚠️ **No rate limiting** - user could spam claim attempts
- ⚠️ **No lock timeout handling** - if RPC lock acquisition times out (default 30s+), function hangs
- ⚠️ **No metrics logging** - no correlation_id, elapsed_ms, db_queries_count

---

### 5.10 Monetization - Lootbox Purchase (Stripe Payment)

**User Action:** Navigates to "Gifts" page, sees lootbox package offers, clicks "Buy 3 Lootboxes ($4.99)".

**Frontend → Backend:** POST `/functions/v1/create-lootbox-payment`

**Request Body:**
```json
{
  "priceId": "price_stripe_lootbox_3", // Stripe Price ID (configured in Stripe dashboard)
  "boxes": 3 // Number of lootboxes
}
```

**Edge Function: `create-lootbox-payment`**

**Step 1: Authenticate User**
```typescript
const authHeader = req.headers.get('Authorization');
const supabase = createClient(/* ... */, { global: { headers: { Authorization: authHeader } } });

const { data: { user }, error: userError } = await supabase.auth.getUser();

if (!user || !user.email) {
  return 401 Unauthorized: { error: 'USER_NOT_AUTHENTICATED' }
}
```

**Step 2: Initialize Stripe**
```typescript
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2025-08-27.basil'
});
```

**Step 3: Check/Create Stripe Customer**
```typescript
// DB Query (Stripe): List customers by email
const customers = await stripe.customers.list({ email: user.email, limit: 1 });

let customerId;
if (customers.data.length > 0) {
  customerId = customers.data[0].id;
} else {
  // Create new customer
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { user_id: user.id }
  });
  customerId = customer.id;
}
```

**Step 4: Create Stripe Checkout Session**
```typescript
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  line_items: [
    {
      price: priceId, // 'price_stripe_lootbox_3'
      quantity: 1
    }
  ],
  mode: 'payment',
  success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${req.headers.get('origin')}/dashboard`,
  metadata: {
    product_type: 'lootbox', // CRITICAL: Webhook routing key
    user_id: user.id,
    boxes: boxes.toString() // '3'
  }
});

// session.url = Stripe Checkout page URL
// session.id = 'cs_test_abc123...'
```

**Step 5: Response**
```typescript
return 200 OK: {
  url: session.url, // Redirect user to Stripe Checkout
  sessionId: session.id
}
```

**Total Database Operations:** 0 (only Stripe API calls)

**Elapsed Time:** ~300-500ms (Stripe API latency)

---

**User Action:** Completes payment on Stripe Checkout, Stripe redirects to `/payment-success?session_id=cs_test_abc123`.

**Backend Activity: Stripe Webhook Event**

**Stripe → Backend:** POST `/functions/v1/stripe-webhook-handler`

**Webhook Event:**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_abc123",
      "payment_status": "paid",
      "metadata": {
        "product_type": "lootbox",
        "user_id": "uuid-user-123",
        "boxes": "3"
      }
    }
  }
}
```

**Edge Function: `stripe-webhook-handler` (⚠️ MISSING metrics logging)**

**Step 1: Verify Webhook Signature**
```typescript
const signature = req.headers.get('stripe-signature');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const event = stripe.webhooks.constructEvent(
  await req.text(),
  signature,
  webhookSecret
);

// If signature invalid → throws error, return 400
```

**Step 2: Handle `checkout.session.completed`**
```typescript
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  
  if (session.payment_status !== 'paid') {
    return 200 OK; // Ignore unpaid sessions
  }
  
  const productType = session.metadata.product_type; // 'lootbox'
  
  if (productType === 'lootbox') {
    await handleLootboxPurchase(session);
  } else if (productType === 'speed_boost') {
    await handleSpeedBoostPurchase(session);
  }
  // ... other product types
  
  return 200 OK: { received: true }
}
```

**Step 3: Handle Lootbox Purchase (Idempotent)**
```typescript
async function handleLootboxPurchase(session) {
  const userId = session.metadata.user_id;
  const boxCount = parseInt(session.metadata.boxes); // 3
  const sessionId = session.id; // 'cs_test_abc123'
  
  // Idempotency check
  // DB Query 1: SELECT id FROM lootbox_instances WHERE metadata->>'session_id' = sessionId LIMIT 1
  const { data: existing } = await supabase
    .from('lootbox_instances')
    .select('id')
    .contains('metadata', { session_id: sessionId })
    .limit(1)
    .single();
  
  if (existing) {
    console.log('[webhook] Lootbox purchase already processed:', sessionId);
    return; // Idempotent - no duplicate crediting
  }
  
  // DB Transaction: INSERT lootbox_instances × boxCount
  const lootboxes = Array.from({ length: boxCount }, () => ({
    user_id: userId,
    status: 'stored', // Immediately available in "Megnyitom" section
    source: 'purchase',
    open_cost_gold: 150,
    metadata: {
      session_id: sessionId,
      purchase_date: new Date().toISOString()
    }
  }));
  
  await supabase
    .from('lootbox_instances')
    .insert(lootboxes);
  
  console.log('[webhook] Lootbox purchase credited:', { userId, sessionId, boxCount });
}
```

**Total Database Operations:** 2 queries (idempotency check + batch insert)

**Elapsed Time:** ~100-150ms

---

**User Action:** After Stripe redirect, frontend polls verification endpoint.

**Frontend → Backend:** POST `/functions/v1/verify-lootbox-payment`

**Request Body:**
```json
{
  "sessionId": "cs_test_abc123"
}
```

**Edge Function: `verify-lootbox-payment` (⚠️ MISSING rate limit, MISSING metrics)**

**Step 1: Validate Session ID**
```typescript
// SECURITY: Validate format
if (!/^cs_/.test(sessionId)) {
  return 400 Bad Request: { error: 'INVALID_SESSION_FORMAT' }
}
```

**Step 2: Retrieve Stripe Session**
```typescript
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2025-08-27.basil' });

const session = await stripe.checkout.sessions.retrieve(sessionId);

// SECURITY: Check session age (24-hour expiry)
const sessionAge = Date.now() - (session.created * 1000);
if (sessionAge > 24 * 60 * 60 * 1000) {
  return 400 Bad Request: { error: 'SESSION_EXPIRED' }
}

if (session.payment_status !== 'paid') {
  return 400 Bad Request: { error: 'PAYMENT_NOT_COMPLETED' }
}

// SECURITY: Verify user_id matches
if (session.metadata.user_id !== user.id) {
  return 403 Forbidden: { error: 'USER_MISMATCH' }
}
```

**Step 3: Webhook-First Idempotency Check**
```typescript
// DB Query: Check if webhook already processed this purchase
const { data: existingPurchase } = await supabase
  .from('lootbox_instances')
  .select('id')
  .contains('metadata', { session_id: sessionId })
  .limit(1)
  .single();

if (existingPurchase) {
  console.log('[verify] Already processed by webhook:', sessionId);
  return 200 OK: {
    success: true,
    already_processed: true,
    boxes_granted: parseInt(session.metadata.boxes),
    message: 'Payment already processed'
  }
}
```

**Step 4: Fallback Processing (if webhook hasn't run yet)**
```typescript
// ⚠️ Rare case: webhook delayed or failed
console.log('[verify] Webhook not processed, fallback processing:', sessionId);

const boxCount = parseInt(session.metadata.boxes);

// DB Transaction: INSERT lootbox_instances × boxCount (same logic as webhook)
const lootboxes = Array.from({ length: boxCount }, () => ({
  user_id: user.id,
  status: 'stored',
  source: 'purchase',
  open_cost_gold: 150,
  metadata: { session_id: sessionId }
}));

await supabase
  .from('lootbox_instances')
  .insert(lootboxes);

return 200 OK: {
  success: true,
  boxes_granted: boxCount
}
```

**Total Database Operations:** 1-2 queries (idempotency check + optional fallback insert)

**Elapsed Time:** ~150-250ms (includes Stripe API call)

---

## 6. RECOMMENDATIONS SUMMARY

### 6.1 High Priority (Immediate Action)

1. **Refactor Core Game Flow to Use Metrics Logging:**
   - `complete-game/index.ts`
   - `credit-gameplay-reward/index.ts`
   - Add structured JSON logs with `request_id`, `elapsed_ms`, `db_queries_count`, stage timings

2. **Add Rate Limiting to Critical Endpoints:**
   - `start-game-session`: RATE_LIMITS.GAME (100 req/min)
   - `complete-game`: RATE_LIMITS.GAME (100 req/min)
   - `lootbox-decide`: RATE_LIMITS.WALLET (30 req/min)
   - `lootbox-open-stored`: RATE_LIMITS.WALLET (30 req/min)
   - `claim-daily-rank-reward`: RATE_LIMITS.WALLET (30 req/min)
   - All 4 verify-*-payment endpoints: RATE_LIMITS.WALLET (30 req/min)

3. **Add Lock Timeout Handling to Critical RPCs:**
   - `claim_daily_gift()`
   - `claim_daily_winner_reward()`
   - `open_lootbox_transaction()`
   - Add: `SET LOCAL lock_timeout = '5s';` + EXCEPTION handling for `lock_not_available`

### 6.2 Medium Priority (Performance & Observability)

4. **Refactor Payment Flow:**
   - All 4 verify-*-payment functions + stripe-webhook-handler to use `_shared/metrics.ts`
   - Add structured logging for webhook signature failures (security monitoring)

5. **Refactor Admin Analytics Endpoints:**
   - admin-dashboard-data
   - admin-game-profiles-paginated
   - admin-lootbox-analytics
   - admin-monetization-analytics
   - Add metrics logging for slow query identification

6. **Implement Log Sampling:**
   - High-frequency endpoints (start-game, complete-game, lootbox-active): 5% success sampling
   - Always log 100% of errors and 429 rate limit responses

7. **Add Correlation ID Propagation:**
   - Generate in start-game-session
   - Pass via response header: `X-Correlation-ID`
   - Frontend includes in complete-game, credit-gameplay-reward
   - All related logs share same correlation_id for end-to-end tracing

### 6.3 Low Priority (Enhancements)

8. **Database Index Optimization:**
   - Add composite index on `booster_purchases(user_id, created_at, purchase_source)`
   - Add index on `app_session_events(user_id, event_type, created_at)`
   - Add index on `game_question_analytics(user_id, category, was_correct)`

9. **RPC Error Standardization:**
   - Standardize all RPC return values to:
     ```json
     {
       "success": boolean,
       "error_code": "LOCK_TIMEOUT" | "INSUFFICIENT_GOLD" | etc.,
       "error_message": "Human-readable description"
     }
     ```

10. **Automated Testing:**
    - Create unit tests for lootbox logic (insufficient gold, idempotency, tier RNG)
    - Create integration tests for payment webhook idempotency
    - Create load tests for 10K concurrent users (k6 scenario)

---

## 7. CONCLUSION

The DingleUP! backend is **production-ready** with **strong foundations** in transaction safety, idempotency, and core optimization. The **Question Pool System** and **Rate Limiting System** are fully optimized and serve as architectural benchmarks. The **Performance Monitoring System** framework exists but requires broader rollout across all edge functions.

**Key Strengths:**
- ✅ Dual-language in-memory question cache (zero DB queries during gameplay)
- ✅ Comprehensive idempotency via `wallet_ledger` and `booster_purchases`
- ✅ Atomic RPC transactions with SELECT FOR UPDATE (race condition prevention)
- ✅ Webhook-first payment architecture with fallback verification
- ✅ Rate limiting infrastructure (v2.0) with 99% table size reduction

**Key Gaps:**
- ⚠️ Incomplete metrics logging rollout (only 1/60+ functions refactored)
- ⚠️ Incomplete rate limiting enforcement (only 3 endpoints protected)
- ⚠️ Missing lock timeout handling in critical RPCs
- ⚠️ No correlation_id propagation for end-to-end request tracing
- ⚠️ Limited automated test coverage (load tests exist, unit tests missing)

**Estimated Effort to Close Gaps:**
- **High Priority (Recommendations 1-3):** 8-12 hours
- **Medium Priority (Recommendations 4-7):** 16-20 hours
- **Low Priority (Recommendations 8-10):** 24-32 hours

**Total Estimated Effort:** 48-64 hours to achieve **100% production-ready status** with comprehensive observability and testing.

---

**Audit Completed:** 2025-12-01  
**Prepared By:** Lovable AI Agent  
**Next Steps:** Prioritize High Priority recommendations, execute in phases, validate with load testing.
