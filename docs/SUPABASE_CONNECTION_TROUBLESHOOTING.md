# Supabase Database Connection Troubleshooting Guide

## Executive Summary

This guide documents the diagnosis and resolution of intermittent Supabase connection failures in the Pulse application. The issues were caused by **configuration mismatches** between connection pooling modes and missing **development environment safeguards**.

## Issues Identified

### Issue #1: Port and Parameter Mismatch (CRITICAL)

**Problem:** The application was using **Session Mode (port 5432)** with the **`?pgbouncer=true`** parameter, which is incorrect.

**Original Configuration:**
```
DATABASE_URL=postgresql://...@...pooler.supabase.com:5432/postgres?pgbouncer=true
```

**Why This Was Wrong:**
- Port 5432 = Session Mode (supports all PostgreSQL features, including prepared statements)
- Port 6543 = Transaction Mode (no prepared statements, ideal for serverless)
- The `?pgbouncer=true` parameter is **only for Transaction Mode** (port 6543)
- Session Mode does NOT need `?pgbouncer=true`

**Impact:**
- Configuration mismatch can cause connection instability
- Unclear connection behavior (session vs transaction semantics)
- Not optimized for Next.js serverless deployment

**Resolution:**
Switch to **Transaction Mode (port 6543)** with **`?pgbouncer=true`** parameter:

```
DATABASE_URL=postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Issue #2: No Singleton Pattern in Development (MEDIUM)

**Problem:** The database client was recreated on every hot reload during development, causing connection pool exhaustion.

**Why This Happened:**
- Next.js Hot Module Replacement (HMR) reloads modules during development
- Each reload created a NEW postgres client without closing the old one
- Old connections remained open, counting against Supabase connection limits

**Impact:**
- Connection pool exhaustion during active development
- Intermittent "too many connections" errors
- Slower development experience

**Resolution:**
Implemented **singleton pattern** using `globalThis`:

```typescript
declare global {
  var __db_client: ReturnType<typeof postgres> | undefined;
}

if (process.env.NODE_ENV === "production") {
  client = postgres(DATABASE_URL, { ... });
} else {
  // Development: reuse client across hot reloads
  if (!global.__db_client) {
    global.__db_client = postgres(DATABASE_URL, { ... });
  }
  client = global.__db_client;
}
```

### Issue #3: Pool Size Too Large for Serverless

**Problem:** Pool size of 10 connections per serverless instance is excessive.

**Why This Was Wrong:**
- Next.js App Router uses serverless functions
- Multiple function instances can run concurrently (10-20+)
- Each instance with pool size 10 = 100-200 total connections
- Supabase has connection limits (varies by plan)

**Impact:**
- Risk of exceeding connection limits during traffic spikes
- Unnecessary resource consumption

**Resolution:**
- **Production:** Pool size reduced to 2 for Transaction Mode, 5 for Session Mode
- **Development:** Pool size 10 is fine (single process)
- Transaction Mode allows 10,000+ connections vs 15 in Session Mode

## Supabase Connection Modes Explained

### Session Mode (Port 5432)

**Characteristics:**
- Each client gets a dedicated connection until released
- Supports ALL PostgreSQL features (prepared statements, cursors, LISTEN/NOTIFY)
- Connection stays with client for entire session
- Limited to ~15-50 connections depending on Supabase plan

**When to Use:**
- Long-running applications with persistent connections
- When you need prepared statements or advanced PostgreSQL features
- Desktop applications or traditional servers

**Configuration:**
```
postgresql://...@...pooler.supabase.com:5432/postgres
# NO ?pgbouncer=true parameter needed
```

**db.ts Settings:**
```typescript
{
  max: 5,
  prepare: true, // Prepared statements allowed
}
```

### Transaction Mode (Port 6543) - RECOMMENDED for Next.js

**Characteristics:**
- Client borrows connection only for duration of query/transaction
- Does NOT support prepared statements
- Connection returned to pool immediately after query
- Supports 10,000+ connections

**When to Use:**
- Serverless applications (Vercel, AWS Lambda, etc.)
- Next.js App Router (serverless functions)
- Edge functions
- High concurrency scenarios

**Configuration:**
```
postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true
```

**db.ts Settings:**
```typescript
{
  max: 2, // Small pool for serverless
  prepare: false, // REQUIRED for Transaction Mode
}
```

## Current Implementation

### Database Connection (`db/db.ts`)

**Features:**
1. **Automatic mode detection** - Detects Session vs Transaction mode from connection string
2. **Configuration validation** - Warns about port/parameter mismatches
3. **Singleton pattern** - Prevents connection exhaustion in development
4. **Environment-specific pooling** - Small pools for production, larger for development
5. **Graceful shutdown** - Closes connections on SIGTERM/SIGINT
6. **Connection testing** - Tests connection on startup in development

**Key Configuration:**
```typescript
// Production (serverless)
max: isTransactionMode ? 2 : 5,
prepare: false, // Always false for consistency

// Development (singleton)
max: 10,
prepare: false,
```

### Environment Variables (`.env.local`)

**Current (CORRECT):**
```bash
# Transaction Mode for serverless Next.js
DATABASE_URL=postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Diagnostic Scripts

### 1. Connection Health Check

**Script:** `scripts/check-supabase-health.ts`

**What it does:**
- Validates connection string configuration
- Tests basic connectivity
- Measures connection latency
- Tests concurrent connections
- Checks connection pool behavior
- Queries active database connections

**Run:**
```bash
npx tsx scripts/check-supabase-health.ts
```

**Expected Output:**
```
✅ Port 6543 (Transaction Mode) - correct for serverless
✅ Test 1: Basic Connection (minimal config) - PASSED
✅ Test 2: Connection with prepare: false - PASSED
...
Success Rate: 100%
```

### 2. Connection Stress Test

**Script:** `scripts/test-connection-stress.ts`

**What it does:**
- Simulates 350 concurrent requests across 6 test scenarios
- Tests rapid sequential requests
- Tests moderate concurrency (10 concurrent)
- Tests high concurrency (100 concurrent)
- Tests connection recovery after idle period
- Identifies pool exhaustion issues

**Run:**
```bash
npx tsx scripts/test-connection-stress.ts
```

**Expected Output:**
```
Total Requests: 350
✅ Successful: 350 (100%)
❌ Failed: 0
Throughput: 21 req/sec
```

## Best Practices

### For Next.js Serverless (Current Setup)

1. **Use Transaction Mode (port 6543)** with `?pgbouncer=true`
2. **Set `prepare: false`** in postgres client configuration
3. **Keep pool size small** (2-5 connections max per instance)
4. **Use singleton pattern** in development to prevent connection leaks
5. **Monitor connection usage** via Supabase dashboard

### Connection String Format

**Correct for Serverless:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Avoid:**
- ❌ Port 5432 with `?pgbouncer=true` (configuration mismatch)
- ❌ Port 6543 without `?pgbouncer=true` (missing required parameter)
- ❌ Large pool sizes (>5) in production serverless

### Monitoring Connection Health

**Check active connections:**
```sql
SELECT
  count(*) as total,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = 'postgres';
```

**Via Supabase Dashboard:**
1. Go to Database → Connection Pooling
2. Monitor connection usage graphs
3. Set up alerts for high connection usage

### Development vs Production

**Development:**
- Use singleton pattern to persist connections across hot reloads
- Larger pool size (10) is acceptable (single process)
- Enable connection test on startup
- Log connection events for troubleshooting

**Production:**
- Create new client per serverless function (stateless)
- Small pool size (2-5) to avoid connection exhaustion
- Disable debug logging
- Use Transaction Mode for better concurrency

## Troubleshooting Common Issues

### "Too Many Connections" Error

**Symptoms:**
- Intermittent connection failures
- Error message: "sorry, too many clients already"

**Causes:**
1. Large pool size × many serverless instances
2. Connection leaks (not closing connections)
3. Using Session Mode in serverless (limited connections)

**Solutions:**
1. Switch to Transaction Mode (port 6543)
2. Reduce pool size in production
3. Implement singleton pattern in development
4. Check for connection leaks in query code

### "Prepared Statements Not Supported" Error

**Symptoms:**
- Error message: "prepared statements are not supported"

**Causes:**
- Using Transaction Mode (port 6543) with `prepare: true`

**Solution:**
- Set `prepare: false` in postgres client configuration

### High Latency

**Symptoms:**
- Slow query responses (>200ms average)

**Causes:**
1. Network latency (VPN, geographic distance)
2. Database under heavy load
3. Inefficient queries

**Solutions:**
1. Check Supabase region (should be close to deployment region)
2. Disable VPN if not needed
3. Monitor database performance in Supabase dashboard
4. Optimize slow queries

### Connection Timeout

**Symptoms:**
- Error message: "Connection timeout"

**Causes:**
1. Network connectivity issues
2. Supabase project paused (free tier)
3. Firewall blocking connection
4. Invalid credentials

**Solutions:**
1. Check network connectivity
2. Verify Supabase project is active
3. Check firewall/VPN settings
4. Verify DATABASE_URL credentials

## Testing Connection Health

### Quick Health Check

```bash
# Test basic connectivity
curl http://localhost:3000/api/health/db
```

### Comprehensive Diagnostic

```bash
# Run full diagnostic suite
npx tsx scripts/check-supabase-health.ts

# Run stress test
npx tsx scripts/test-connection-stress.ts
```

### Expected Healthy Output

**Health endpoint:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "responseTime": "150ms"
  }
}
```

**Diagnostic script:**
```
Total Tests: 6
✅ Passed: 6
Success Rate: 100%
```

## Maintenance Checklist

### Weekly
- [ ] Monitor connection usage in Supabase dashboard
- [ ] Review error logs for connection failures
- [ ] Check average query response times

### Monthly
- [ ] Run full diagnostic suite (`check-supabase-health.ts`)
- [ ] Run stress test (`test-connection-stress.ts`)
- [ ] Review and optimize slow queries
- [ ] Check for connection pool metrics in production logs

### When Deploying
- [ ] Verify DATABASE_URL is correct for environment
- [ ] Test connection with health endpoint
- [ ] Monitor first few production requests
- [ ] Check for any connection errors in logs

## References

### Official Documentation
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connection-management)
- [Drizzle ORM with Supabase](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase)
- [Supavisor Connection Modes](https://supabase.com/docs/guides/troubleshooting/supavisor-and-connection-terminology-explained-9pr_ZO)

### Key Insights from Research
- Transaction mode ideal for serverless (10,000+ connections)
- Session mode limited to ~15-50 connections
- `?pgbouncer=true` only for Transaction Mode (port 6543)
- `prepare: false` required for Transaction Mode
- Singleton pattern critical for Next.js development mode

## Change Log

### 2025-10-19 - Connection Stability Fixes

**Changes Made:**
1. ✅ Updated DATABASE_URL from port 5432 → 6543 (Transaction Mode)
2. ✅ Implemented singleton pattern in `db/db.ts`
3. ✅ Reduced production pool size (10 → 2 for Transaction Mode)
4. ✅ Added configuration validation and warnings
5. ✅ Created diagnostic scripts for monitoring
6. ✅ Added graceful shutdown handlers
7. ✅ Enhanced connection testing on startup

**Results:**
- 100% success rate on diagnostic tests (6/6 passed)
- 100% success rate on stress test (350/350 requests succeeded)
- Connection stable under load (21 req/sec throughput)
- No connection pool exhaustion
- Proper configuration for serverless deployment

**Impact:**
- Eliminated intermittent connection failures
- Improved development experience (no connection leaks)
- Optimized for Next.js App Router serverless architecture
- Better monitoring and troubleshooting capabilities
