# DingleUP! Database Schema

PostgreSQL database schema for the DingleUP! quiz game.

## 📊 Database Overview

- **Engine**: PostgreSQL 15+
- **ORM**: None (raw SQL + Supabase)
- **Migrations**: Sequentially numbered SQL files
- **RLS**: Row Level Security enabled on user data
- **Indexes**: Optimized for read-heavy workloads

## 🗂️ Schema Export

The complete database schema is available in `schema_latest.sql`. This file includes:

- All table definitions
- All indexes
- All RLS policies
- All database functions (RPCs)
- All triggers
- All enums and types

## 🚀 Setup

### Fresh Database

```bash
# Create database
createdb dingleup

# Load schema
psql -U postgres -d dingleup -f schema_latest.sql

# Verify tables
psql -U postgres -d dingleup -c "\dt"
```

### Connection String

```
postgresql://username:password@localhost:5432/dingleup
```

## 📋 Core Tables

### Users & Authentication

- `auth.users` - Supabase managed auth table
- `profiles` - User profiles and wallet data
- `user_roles` - Role-based access control (admin, user)

### Game System

- `questions` - Quiz questions (4500 total)
- `question_pools` - 15 pools of 300 questions each
- `topics` - 30 categories
- `game_sessions` - Active game sessions
- `game_results` - Completed games
- `game_question_analytics` - Per-question analytics

### Leaderboards

- `daily_rankings` - Daily user rankings (mixed category)
- `daily_leaderboard_snapshot` - Historical snapshots
- `global_leaderboard` - All-time rankings
- `leaderboard_cache` - TOP 100 per country cache
- `daily_winner_awarded` - Daily prize awards

### Economy

- `wallet_ledger` - All coin transactions
- `lives_ledger` - All life transactions
- `purchases` - Payment records
- `booster_purchases` - Booster purchases
- `booster_types` - Available boosters

### Lootbox System

- `lootbox_instances` - Individual lootboxes
- `lootbox_daily_plan` - Daily drop schedule per user

### Social

- `friendships` - Friend connections
- `invitations` - Referral invitations
- `dm_threads` - Direct message threads
- `dm_messages` - Direct messages

### Admin & Analytics

- `admin_audit_log` - Admin action tracking
- `app_session_events` - User session tracking
- `engagement_analytics` - Aggregated metrics
- `error_logs` - Frontend error tracking

## 🔐 Row Level Security (RLS)

RLS is **enabled** on all user-specific tables:

```sql
-- Example: profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### RLS Exceptions

Leaderboard tables have **RLS disabled** (public data):
- `daily_rankings`
- `global_leaderboard`
- `daily_leaderboard_snapshot`
- `leaderboard_cache`

## 🔧 Database Functions (RPCs)

### Wallet Operations

```sql
-- Credit coins and lives atomically
credit_wallet(
  p_user_id uuid,
  p_delta_coins integer,
  p_delta_lives integer,
  p_source text,
  p_idempotency_key text,
  p_metadata jsonb DEFAULT '{}'
)

-- Credit lives only
credit_lives(
  p_user_id uuid,
  p_delta_lives integer,
  p_source text,
  p_idempotency_key text,
  p_metadata jsonb DEFAULT '{}'
)
```

### Game Operations

```sql
-- Update daily rankings (aggregate)
upsert_daily_ranking_aggregate(
  p_user_id uuid,
  p_correct_answers integer,
  p_average_response_time numeric
)

-- Regenerate lives for users
regenerate_lives_background()
```

### Lootbox Operations

```sql
-- Open lootbox (atomic transaction)
open_lootbox_transaction(
  p_lootbox_id uuid,
  p_user_id uuid,
  p_tier text,
  p_gold_reward integer,
  p_life_reward integer,
  p_idempotency_key text,
  p_open_cost integer DEFAULT 150
)

-- Create new lootbox drop
create_lootbox_drop(
  p_user_id uuid,
  p_source text,
  p_open_cost_gold integer,
  p_expires_at timestamptz,
  p_metadata jsonb DEFAULT '{}'
)
```

### Rate Limiting

```sql
-- Check if user exceeded rate limit
check_rate_limit(
  p_rpc_name text,
  p_max_calls integer DEFAULT 10,
  p_window_minutes integer DEFAULT 1
) RETURNS boolean
```

### Admin Functions

```sql
-- Check if user has admin role
has_role(p_user_id uuid, p_role text) RETURNS boolean

-- Log admin action
log_admin_action(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL,
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL
)
```

## 📈 Indexes

Key indexes for performance:

```sql
-- User lookups
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_country ON profiles(country_code);

-- Game queries
CREATE INDEX idx_game_results_user_completed ON game_results(user_id, completed);
CREATE INDEX idx_game_sessions_expires ON game_sessions(expires_at) WHERE completed_at IS NULL;

-- Wallet operations
CREATE INDEX idx_wallet_ledger_user_created ON wallet_ledger(user_id, created_at DESC);
CREATE INDEX idx_wallet_ledger_idempotency ON wallet_ledger(idempotency_key);

-- Leaderboard
CREATE INDEX idx_daily_rankings_day_category ON daily_rankings(day_date, category, total_correct_answers DESC);
CREATE INDEX idx_leaderboard_cache_country_rank ON leaderboard_cache(country_code, rank);

-- Rate limiting
CREATE INDEX idx_rpc_rate_limits_window ON rpc_rate_limits(user_id, rpc_name, window_start);
```

## 🔄 Triggers

### Automatic Timestamps

```sql
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Life Regeneration Sync

```sql
CREATE TRIGGER sync_active_speed_token
  AFTER INSERT OR UPDATE ON speed_tokens
  FOR EACH ROW
  EXECUTE FUNCTION sync_active_speed_token();
```

### Thread Updates

```sql
CREATE TRIGGER update_thread_last_message
  AFTER INSERT ON dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();
```

## 📊 Materialized Views

### Daily Rankings (Optimized)

```sql
CREATE MATERIALIZED VIEW mv_daily_rankings_current AS
SELECT 
  user_id,
  day_date,
  total_correct_answers,
  ROW_NUMBER() OVER (
    PARTITION BY day_date 
    ORDER BY total_correct_answers DESC, average_response_time ASC
  ) as rank
FROM daily_rankings
WHERE day_date = CURRENT_DATE
  AND category = 'mixed';

-- Refresh every 5 minutes via cron
CREATE INDEX ON mv_daily_rankings_current(user_id);
```

## 🧹 Maintenance

### Cleanup Jobs

```sql
-- Remove expired game sessions (hourly)
DELETE FROM game_sessions 
WHERE expires_at < NOW() 
  AND completed_at IS NULL;

-- Archive old ledger entries (monthly)
-- Moves entries older than 90 days to archive tables
SELECT archive_old_wallet_ledger();
SELECT archive_old_lives_ledger();
```

### Vacuum

```bash
# Vacuum analyze for performance
psql -U postgres -d dingleup -c "VACUUM ANALYZE;"

# Full vacuum (requires downtime)
psql -U postgres -d dingleup -c "VACUUM FULL;"
```

## 🔍 Monitoring Queries

### Active Connections

```sql
SELECT count(*) FROM pg_stat_activity 
WHERE datname = 'dingleup';
```

### Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

### Slow Queries

```sql
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 🛠️ Migration Guide

### Adding New Migration

1. Create new SQL file: `YYYYMMDD_description.sql`
2. Add migration SQL
3. Run migration: `psql -U postgres -d dingleup -f migration.sql`
4. Update `schema_latest.sql` with changes

### Rollback Strategy

- Keep backups before migrations
- Test on staging environment first
- Use transactions where possible

```sql
BEGIN;
-- Migration SQL
COMMIT;
-- Or ROLLBACK if errors
```

## 📱 Supabase-Specific

### Auth Schema

Supabase manages `auth` schema automatically:
- `auth.users` - User authentication
- `auth.sessions` - Active sessions
- `auth.refresh_tokens` - JWT refresh tokens

**DO NOT** manually modify auth schema.

### Storage

File storage uses `storage` schema:
- `storage.buckets` - Storage buckets
- `storage.objects` - Uploaded files

### Realtime

Enable realtime on specific tables:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
```

## 🔗 Connection Pooling

Recommended: Use PgBouncer or Supabase connection pooling.

```
# Direct connection (max 100)
postgresql://user:pass@host:5432/dingleup

# Pooled connection (max 10000)
postgresql://user:pass@host:6543/dingleup?pgbouncer=true
```

## 📝 Schema Documentation

Full table documentation with column descriptions is maintained in `DATABASE_SCHEMA_DOCUMENTATION.sql`.

## 🔒 Security Best Practices

1. **Never expose service role key** in frontend
2. **Enable RLS** on all user data tables
3. **Use parameterized queries** to prevent SQL injection
4. **Rotate database passwords** regularly
5. **Monitor admin_audit_log** for suspicious activity
6. **Backup database daily**

## 🧪 Testing

```bash
# Run database tests
psql -U postgres -d dingleup_test -f schema_latest.sql
psql -U postgres -d dingleup_test -f tests/test_rpcs.sql
```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
