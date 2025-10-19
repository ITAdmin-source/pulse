# Supabase Connection Stability - Diagnostic Report

**Date:** October 19, 2025
**Project:** Pulse - Participatory Polling Platform
**Database:** Supabase PostgreSQL with Drizzle ORM
**Framework:** Next.js 15 App Router (Serverless)

---

## Executive Summary

Comprehensive diagnosis of intermittent Supabase connection failures revealed **three critical issues**:

1. **Port/Parameter Mismatch** - Using Session Mode port with Transaction Mode parameter
2. **Missing Singleton Pattern** - Connection exhaustion in development from hot reloads
3. **Oversized Connection Pool** - Pool too large for serverless architecture

**All issues have been resolved.** Connection is now stable with 100% success rate across 350+ test requests.

---

## Root Cause Analysis

### Issue #1: Configuration Mismatch (CRITICAL)

**Evidence:**
```bash
# BEFORE (INCORRECT)
Port: 5432 (Session Mode)
Parameter: ?pgbouncer=true (for Transaction Mode only)
```

**Web Research Findings:**
- Port 5432 = Session Mode (does NOT use `?pgbouncer=true`)
- Port 6543 = Transaction Mode (REQUIRES `?pgbouncer=true`)
- [Supabase Docs](https://supabase.com/docs/guides/database/connecting-to-postgres): Transaction Mode pooler connects on port 6543
- [Supabase Discussion #32755](https://github.com/orgs/supabase/discussions/32755): Port 6543 only supports Transaction Mode as of Feb 2025

**Impact:**
- Configuration mismatch causes undefined connection behavior
- Not optimized for serverless (Session Mode limited to ~15-50 connections)
- Transaction Mode supports 10,000+ connections

**Resolution:**
```bash
# AFTER (CORRECT)
Port: 6543 (Transaction Mode)
Parameter: ?pgbouncer=true
prepare: false (required for Transaction Mode)
```

**Verification:**
```
✅ Port 6543 (Transaction Mode) - correct for serverless
✅ All 6 diagnostic tests passed
```

---

### Issue #2: No Singleton Pattern for Development (MEDIUM)

**Evidence:**
```typescript
// BEFORE - Creates new client on every hot reload
let client: ReturnType<typeof postgres>;
client = postgres(process.env.DATABASE_URL, { ... });
```

**Web Research Findings:**
- [Next.js Discussion #18008](https://github.com/vercel/next.js/discussions/18008): HMR causes duplicate database objects
- [Next.js Issue #45483](https://github.com/vercel/next.js/issues/45483): Fast Refresh causes connection exhaustion
- Industry standard: Use `globalThis` to persist connections across reloads
- [Prisma Pattern](https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices): Singleton for development

**Impact:**
- Each hot reload creates NEW client without closing old one
- Old connections remain open, counting against Supabase limits
- Connection pool exhaustion during active development

**Resolution:**
```typescript
// AFTER - Singleton pattern in development
declare global {
  var __db_client: ReturnType<typeof postgres> | undefined;
}

if (process.env.NODE_ENV === "production") {
  client = postgres(...); // New client per serverless function
} else {
  if (!global.__db_client) {
    global.__db_client = postgres(...); // Create once
  }
  client = global.__db_client; // Reuse across reloads
}
```

**Verification:**
```
[DB] Creating new database client (singleton)
[DB] ✅ Connection test successful
[DB] Reusing existing database client (singleton) // On hot reload
```

---

### Issue #3: Pool Size Too Large (LOW-MEDIUM)

**Evidence:**
```typescript
// BEFORE - Large pool for serverless
max: 10, // Same for both development and production
```

**Web Research Findings:**
- [Serverless Best Practices](https://www.answeroverflow.com/m/1313545958818189313): Pool size of 1-2 optimal for serverless
- Multiple serverless instances × pool size 10 = rapid connection exhaustion
- Transaction Mode designed for serverless with small pools
- Session Mode: Each connection exclusively assigned to one client

**Impact:**
- Risk of exceeding connection limits during traffic spikes
- Unnecessary resource consumption
- Not optimized for Next.js App Router (serverless functions)

**Resolution:**
```typescript
// AFTER - Environment-specific pool sizes
if (process.env.NODE_ENV === "production") {
  max: isTransactionMode ? 2 : 5, // Small for serverless
} else {
  max: 10, // Larger for development (single process)
}
```

**Verification:**
- Pool exhaustion test passed (100 concurrent requests, 100% success)
- Average response time: 1770ms for 100 concurrent (acceptable)
- No connection failures under stress

---

## Test Results

### Diagnostic Suite (`check-supabase-health.ts`)

```
═══════════════════════════════════════════════════════
  TEST SUMMARY
═══════════════════════════════════════════════════════

Total Tests: 6
✅ Passed: 6
❌ Failed: 0
Success Rate: 100%

Configuration Validation:
✅ Port 6543 (Transaction Mode) - correct for serverless

Test Results:
✅ Test 1: Basic Connection (minimal config) - 671ms
✅ Test 2: Connection with prepare: false - 532ms
✅ Test 3: Connection Latency (5 queries) - avg 218ms
✅ Test 4: Concurrent Connections (10 parallel) - 737ms
✅ Test 5: Pool Behavior (idle timeout test) - 7014ms
✅ Test 6: Active Database Connections - 537ms

Active Connections:
- Total: 16
- Active: 1
- Idle: 13
- postgres-js: 0
```

### Stress Test (`test-connection-stress.ts`)

```
═══════════════════════════════════════════════════════
  STRESS TEST SUMMARY
═══════════════════════════════════════════════════════

Total Requests: 350
✅ Successful: 350 (100%)
❌ Failed: 0
Total Duration: 16443ms
Throughput: 21 req/sec

Individual Test Results:
✅ Test 1: 50 Rapid Sequential - 100% (avg 157ms)
✅ Test 2: 100 w/ 10 Concurrent - 100% (avg 250ms)
✅ Test 3: 50 w/ 20 Concurrent - 100% (avg 393ms)
✅ Test 4: 30 DB-Intensive Queries - 100% (avg 150ms)
✅ Test 5: 100 Concurrent (pool exhaustion) - 100% (avg 1770ms)
✅ Test 6: Post-Idle Recovery - 100% (avg 242ms)
```

**Analysis:**
- Zero failures across 350 requests
- All concurrency scenarios handled successfully
- Connection recovery works correctly after idle period
- No pool exhaustion even with 100 concurrent requests

---

## Implementation Details

### Files Modified

**1. `db/db.ts` - Database Connection**

**Changes:**
- ✅ Added configuration validation (port/parameter checks)
- ✅ Implemented singleton pattern for development
- ✅ Environment-specific pool sizes (2-5 prod, 10 dev)
- ✅ Set `prepare: false` for Transaction Mode compatibility
- ✅ Added connection test on startup
- ✅ Added graceful shutdown handlers (SIGTERM/SIGINT)
- ✅ Enhanced logging for troubleshooting

**2. `.env.local` - Environment Variables**

**Changes:**
```bash
# BEFORE
DATABASE_URL=postgresql://...@...pooler.supabase.com:5432/postgres?pgbouncer=true

# AFTER
DATABASE_URL=postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true
```

Port changed from **5432 → 6543** (Session Mode → Transaction Mode)

### Files Created

**1. `scripts/check-supabase-health.ts`**

Comprehensive diagnostic tool that:
- Validates connection configuration
- Tests basic connectivity
- Measures latency (5 sequential queries)
- Tests concurrent connections (10 parallel)
- Tests pool behavior with idle timeout
- Queries active database connections
- Provides configuration recommendations

**2. `scripts/test-connection-stress.ts`**

Stress testing tool that:
- Simulates 350 concurrent requests
- Tests 6 different load scenarios
- Tests rapid sequential requests
- Tests moderate concurrency (10 concurrent)
- Tests high concurrency (100 concurrent)
- Tests connection recovery after idle
- Identifies pool exhaustion issues

**3. `docs/SUPABASE_CONNECTION_TROUBLESHOOTING.md`**

Complete troubleshooting guide covering:
- Issue diagnosis and resolution
- Connection modes explained (Session vs Transaction)
- Best practices for Next.js serverless
- Diagnostic scripts usage
- Common issues and solutions
- Maintenance checklist

**4. `docs/CONNECTION_DIAGNOSIS_REPORT.md`**

This comprehensive diagnostic report.

---

## Configuration Summary

### Correct Configuration (Current)

**Connection String:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Connection Settings:**
```typescript
// Production (serverless)
{
  max: 2,                    // Small pool for serverless
  idle_timeout: 20,
  connect_timeout: 30,
  max_lifetime: 1800,        // 30 minutes
  prepare: false,            // Required for Transaction Mode
}

// Development (singleton)
{
  max: 10,                   // Larger pool OK (single process)
  idle_timeout: 20,
  connect_timeout: 30,
  max_lifetime: 1800,
  prepare: false,
  debug: false,              // Enable for query logging
}
```

**Why This Works:**
1. **Transaction Mode (port 6543)** - Optimized for serverless, supports 10,000+ connections
2. **`?pgbouncer=true`** - Disables prepared statements (required for Transaction Mode)
3. **`prepare: false`** - Matches Transaction Mode requirements
4. **Small pool (2)** - Prevents connection exhaustion with multiple serverless instances
5. **Singleton pattern** - Prevents connection leaks in development

---

## Best Practices Established

### For Serverless Next.js

1. ✅ Use Transaction Mode (port 6543) with `?pgbouncer=true`
2. ✅ Set `prepare: false` in postgres client
3. ✅ Keep pool size small (2-5 max)
4. ✅ Implement singleton pattern in development
5. ✅ Monitor connection usage via Supabase dashboard
6. ✅ Test connection on startup in development
7. ✅ Implement graceful shutdown handlers

### Monitoring & Maintenance

**Run Diagnostics:**
```bash
# Quick health check
curl http://localhost:3000/api/health/db

# Comprehensive diagnostic
npx tsx scripts/check-supabase-health.ts

# Stress test
npx tsx scripts/test-connection-stress.ts
```

**Check Active Connections:**
```sql
SELECT
  count(*) as total,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = 'postgres';
```

---

## Comparison: Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Configuration | Port 5432 + ?pgbouncer=true (mismatch) | Port 6543 + ?pgbouncer=true (correct) | ✅ Proper config |
| Development Pattern | New client per reload | Singleton pattern | ✅ No leaks |
| Production Pool Size | 10 per instance | 2 per instance | ✅ 80% reduction |
| Connection Mode | Session Mode (~15-50 max) | Transaction Mode (10,000+ max) | ✅ 200x+ capacity |
| Diagnostic Tests | None | 6 automated tests | ✅ Full coverage |
| Stress Test Success | Unknown | 350/350 (100%) | ✅ Proven stable |
| Connection Validation | Manual | Automatic warnings | ✅ Self-diagnosing |
| Shutdown Handling | None | Graceful (SIGTERM/SIGINT) | ✅ Clean cleanup |

---

## Confidence Level: HIGH

**Evidence Supporting Stability:**

1. ✅ **100% test success rate** across diagnostic suite (6/6 tests)
2. ✅ **100% stress test success** (350/350 requests succeeded)
3. ✅ **Proper configuration** validated by research and Supabase docs
4. ✅ **Industry best practices** implemented (singleton, small pools, Transaction Mode)
5. ✅ **No connection leaks** in development (singleton prevents exhaustion)
6. ✅ **Pool exhaustion test passed** (100 concurrent requests, no failures)
7. ✅ **Connection recovery verified** (idle timeout test passed)

**Remaining Concerns:**

1. ⚠️ **Latency** - Average 218ms (acceptable but could be optimized)
   - Cause: Geographic distance or network latency
   - Not a connection stability issue
   - Consider: Check VPN, verify Supabase region

---

## Recommendations

### Immediate Actions (Completed)

- ✅ Update DATABASE_URL to port 6543
- ✅ Implement singleton pattern in db.ts
- ✅ Reduce production pool size
- ✅ Add configuration validation
- ✅ Create diagnostic scripts

### Ongoing Monitoring

1. **Weekly:**
   - Monitor connection usage in Supabase dashboard
   - Review error logs for connection failures

2. **Monthly:**
   - Run diagnostic suite (`check-supabase-health.ts`)
   - Run stress test (`test-connection-stress.ts`)
   - Review query performance metrics

3. **Before Each Deployment:**
   - Test health endpoint (`/api/health/db`)
   - Verify DATABASE_URL is correct
   - Check first few production requests

### Future Optimizations (Optional)

1. **Connection Pooling Service:**
   - Consider Supabase's Supavisor for additional connection management
   - Already using Transaction Mode pooler (sufficient for now)

2. **Query Performance:**
   - Profile slow queries (avg >500ms)
   - Add database indexes where needed
   - Use query explain analyze for optimization

3. **Geographic Optimization:**
   - Verify Supabase region matches deployment region
   - Consider read replicas if latency becomes critical

---

## Conclusion

The intermittent connection failures were caused by a **configuration mismatch** (Session Mode port with Transaction Mode parameter) and **missing development safeguards** (singleton pattern).

**All issues have been resolved:**

1. ✅ Switched to Transaction Mode (port 6543) - proper serverless configuration
2. ✅ Implemented singleton pattern - prevents development connection leaks
3. ✅ Optimized pool sizes - 2 for production, 10 for development
4. ✅ Added validation and monitoring - self-diagnosing system
5. ✅ Created comprehensive diagnostic tools - ongoing health checks

**Connection is now stable** with 100% success rate across 350+ test requests under various load scenarios.

**High confidence** that the connection will remain stable under normal operational conditions.

---

## Additional Resources

**Documentation:**
- [Supabase Connection Troubleshooting Guide](./SUPABASE_CONNECTION_TROUBLESHOOTING.md)
- [Supabase Connection Management Docs](https://supabase.com/docs/guides/database/connection-management)
- [Drizzle ORM Supabase Guide](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase)

**Diagnostic Scripts:**
- `scripts/check-supabase-health.ts` - Comprehensive connection health check
- `scripts/test-connection-stress.ts` - Connection stress testing

**Health Endpoints:**
- `/api/health/db` - Basic database health check
- `/api/test/database-connection` - Detailed connection test

---

**Report Generated:** October 19, 2025
**Status:** ✅ RESOLVED - Connection Stable
**Next Review:** Weekly monitoring via diagnostic scripts
