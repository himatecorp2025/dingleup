# DingleUP! Backend

Supabase Edge Functions backend for the DingleUP! quiz game.

## 🏗️ Architecture

The backend is built on **Supabase Edge Functions** using the Deno runtime. All functions are serverless and auto-scaling.

### Edge Functions

- **Authentication**: `register-with-username-pin`, `login-with-username-pin`, `forgot-pin`
- **Game Flow**: `start-game-session`, `complete-game`, `credit-gameplay-reward`
- **Lootbox System**: `lootbox-active`, `lootbox-decide`, `lootbox-open-stored`
- **Daily Rewards**: `get-daily-gift-status`, `process-daily-winners`, `claim-daily-rank-reward`
- **Payments**: `create-lootbox-payment`, `verify-lootbox-payment`, `stripe-webhook-handler`
- **Admin**: `admin-dashboard-data`, `admin-game-profiles`, `admin-lootbox-analytics`
- **Background Jobs**: `regenerate-lives-background`, `cleanup-game-sessions`, `archive-ledgers`

## 📦 Setup

### Prerequisites

- Deno 1.37+ (for local development)
- Supabase CLI (optional)
- PostgreSQL connection for database operations

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI Configuration (optional, for AI features)
OPENAI_API_KEY=sk-...

# Rate Limiting
RATE_LIMIT_ENABLED=true
```

### Local Development

```bash
# Install Deno
curl -fsSL https://deno.land/x/install/install.sh | sh

# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase (includes edge functions runtime)
supabase start

# Deploy functions locally
supabase functions serve

# Test a function
curl http://localhost:54321/functions/v1/get-wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Production Deployment

```bash
# Link to your Supabase project
supabase link --project-ref your-project-id

# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy get-wallet

# View logs
supabase functions logs get-wallet
```

## 🔐 Authentication

All edge functions use JWT-based authentication except public endpoints (login, register).

### Protected Endpoints

Add JWT token in Authorization header:

```bash
Authorization: Bearer <jwt-token>
```

### Rate Limiting

Rate limiting is enforced on critical endpoints:

- **Game**: 100 req/min (start-game), 20 req/min (complete-game)
- **Lootbox**: 30-50 req/min
- **Auth**: 5 req/15min (login/register)
- **Payments**: 15 req/min

## 📊 Metrics & Monitoring

All functions include:
- Request ID tracking (`correlation_id`)
- Detailed execution timing logs
- Stage-level performance metrics
- Error tracking with stack traces
- Log sampling (5% success, 100% errors)

### Log Format

```json
{
  "request_id": "uuid",
  "function": "complete-game",
  "user_id": "uuid",
  "elapsed_ms": 145,
  "status": "SUCCESS",
  "stages": {
    "validation": 12,
    "db_operations": 89,
    "ranking_update": 44
  }
}
```

## 🔧 Database Operations

### RPC Functions

Edge functions call PostgreSQL RPC functions for complex operations:

- `credit_wallet(user_id, delta_coins, delta_lives, source, idempotency_key, metadata)`
- `credit_lives(user_id, delta_lives, source, idempotency_key, metadata)`
- `upsert_daily_ranking_aggregate(user_id, correct_answers, avg_response_time)`
- `claim_daily_winner_reward(user_id, day_date)`
- `open_lootbox_transaction(lootbox_id, user_id, tier, gold_reward, life_reward, idempotency_key, open_cost)`

### Idempotency

All credit operations support idempotency keys to prevent duplicate processing:

```typescript
const idempotencyKey = `source:${userId}:${uniqueId}:${timestamp}`;
```

## 💳 Stripe Integration

### Webhook Handler

The `stripe-webhook-handler` processes all Stripe events:

1. Verify webhook signature
2. Extract event data
3. Process payment_intent.succeeded events
4. Credit user rewards atomically
5. Return 200 OK

### Payment Flow

1. Frontend calls `create-lootbox-payment`
2. Backend creates Stripe PaymentIntent
3. User completes payment (Stripe Checkout/Payment Sheet)
4. Stripe webhook fires
5. `stripe-webhook-handler` credits rewards
6. `verify-lootbox-payment` checks status (fallback)

## 🎮 Game Flow

### Start Game

```typescript
POST /start-game-session
Body: { category: "mixed" }
Response: {
  success: true,
  session_id: "uuid",
  questions: [...], // 15 questions
  correlation_id: "uuid"
}
```

### Complete Game

```typescript
POST /complete-game
Body: {
  session_id: "uuid",
  correct_answers: 12,
  total_questions: 15,
  average_response_time: 5.2,
  correlation_id: "uuid"
}
Response: {
  success: true,
  coins_earned: 240,
  current_rank: 15
}
```

### Credit Reward

```typescript
POST /credit-gameplay-reward
Body: {
  session_id: "uuid",
  question_index: 5,
  correlation_id: "uuid"
}
Response: {
  success: true,
  coins_granted: 20,
  lives_granted: 0
}
```

## 🎁 Lootbox System

### Check Active Lootbox

```typescript
GET /lootbox-active
Response: {
  success: true,
  lootbox: {
    id: "uuid",
    expires_at: "2024-01-31T23:59:59Z",
    status: "active_drop"
  }
}
```

### Decide Action

```typescript
POST /lootbox-decide
Body: {
  lootbox_id: "uuid",
  decision: "open" | "store"
}
Response: {
  success: true,
  action: "open",
  reward: { tier: "gold", gold: 150, life: 3 }
}
```

## 📈 Admin Functions

Admin functions require `admin` role in `user_roles` table.

### Dashboard Data

```typescript
GET /admin-dashboard-data
Headers: { Authorization: "Bearer <admin-jwt>" }
Response: {
  totalUsers: 15420,
  activeUsers: 8341,
  dailyActiveUsers: 2145,
  totalRevenue: 45231.50,
  ...
}
```

## 🔄 Background Jobs (Cron)

Configured in `supabase/config.toml`:

- `* * * * *` - regenerate-lives-background (every minute)
- `*/5 * * * *` - process-daily-winners (every 5 minutes)
- `0 * * * *` - cleanup-game-sessions (hourly)
- `0 3 1 * *` - archive-ledgers (monthly)

## 🐛 Error Handling

### Standard Error Format

```json
{
  "success": false,
  "error_code": "INSUFFICIENT_GOLD",
  "error_message": "User has insufficient gold balance",
  "details": { "required": 150, "current": 89 }
}
```

### Error Codes

- `LOCK_TIMEOUT` - Database lock exceeded 5s
- `INSUFFICIENT_GOLD` - Not enough gold for operation
- `INSUFFICIENT_LIVES` - Not enough lives for game
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INVALID_SESSION` - Game session invalid/expired
- `ALREADY_CLAIMED` - Reward already claimed
- `PAYMENT_FAILED` - Stripe payment failed

## 🧪 Testing

```bash
# Run function tests
deno test

# Load testing
cd ../load-tests
npm run test:backend
```

## 📊 Performance Targets

- **Game start**: <100ms
- **Complete game**: <200ms
- **Credit reward**: <50ms
- **Lootbox operations**: <150ms
- **Payment verification**: <300ms

## 🔒 Security Features

- JWT verification on all protected endpoints
- Rate limiting with `check_rate_limit` RPC
- Input validation (Zod schemas)
- SQL injection prevention (parameterized queries)
- CORS policies
- Stripe webhook signature verification
- Idempotency protection

## 📝 Adding New Functions

1. Create new function directory: `supabase/functions/my-function/`
2. Add `index.ts` with handler
3. Add function config in `supabase/config.toml`
4. Deploy: `supabase functions deploy my-function`

### Template

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return handleCorsPreflight(origin);
  const corsHeaders = getCorsHeaders(origin);

  try {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Your logic here

    const elapsed = Date.now() - startTime;
    console.log(`[my-function] request_id=${requestId} SUCCESS in ${elapsed}ms`);

    return new Response(
      JSON.stringify({ success: true, elapsed_ms: elapsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(`[my-function] ERROR:`, error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## 🔗 Useful Links

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Stripe API Reference](https://stripe.com/docs/api)
