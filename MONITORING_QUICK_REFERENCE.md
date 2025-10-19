# Monitoring Quick Reference

Quick reference guide for production monitoring of the Pulse application.

## 🚀 Quick Links

| Tool | Dashboard | Purpose |
|------|-----------|---------|
| **Vercel Analytics** | [vercel.com/pulse/analytics](https://vercel.com/YOUR_ORG/pulse/analytics) | Traffic, Core Web Vitals, Performance |
| **Sentry** | [sentry.io](https://sentry.io/organizations/YOUR_ORG/issues/) | Errors, Performance, Session Replay |
| **BetterStack** | [betterstack.com/uptime](https://betterstack.com/uptime) | Uptime, Status Page, Alerts |
| **Supabase** | [app.supabase.com](https://app.supabase.com/project/YOUR_PROJECT/database/query-performance) | Database, Queries, Connections |

---

## 🔍 Health Check Endpoints

```bash
# Basic health check
curl https://crowdsource.co.il/api/health/db
# Response: {"status":"healthy","database":{"connected":true,...}}

# Advanced health check (with memory, connections)
curl https://crowdsource.co.il/api/health/advanced
# Response: {"status":"healthy","checks":{...}}

# Quick status check
npm run monitor:check
```

---

## 📊 Key Metrics to Monitor

### Critical Metrics (Check Daily)

1. **Error Rate**
   - Target: < 0.1% (1 error per 1000 requests)
   - Alert threshold: > 10 errors/minute
   - Dashboard: Sentry > Issues

2. **Uptime**
   - Target: > 99.9%
   - Alert threshold: 2 consecutive failures
   - Dashboard: BetterStack > Monitors

3. **API Response Time**
   - Target: P95 < 500ms
   - Alert threshold: P95 > 2 seconds
   - Dashboard: Sentry > Performance

4. **Database Query Performance**
   - Target: P95 < 200ms
   - Alert threshold: > 1 second
   - Dashboard: Supabase > Query Performance

### User Experience Metrics

5. **Core Web Vitals**
   - LCP (Largest Contentful Paint): < 2.5s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1
   - Dashboard: Vercel Analytics > Speed Insights

6. **Page Load Time**
   - Target: < 3 seconds
   - Mobile target: < 4 seconds
   - Dashboard: Vercel Analytics > Performance

### Business Metrics

7. **Vote Success Rate**
   - Target: > 95%
   - Dashboard: Sentry > Custom Metrics

8. **Poll Completion Rate**
   - Target: > 60% (users who vote 10+ times)
   - Dashboard: Sentry > Custom Metrics

---

## 🚨 Alert Response Guide

### Critical: Site Down (Response: Immediate)

**Symptoms:**
- BetterStack alerts "Site is down"
- Multiple health check failures

**Steps:**
1. Check Vercel deployment status: https://vercel.com/YOUR_ORG/pulse/deployments
2. Check Vercel system status: https://www.vercel-status.com/
3. Check Supabase status: https://status.supabase.com/
4. Review recent deployments (rollback if needed)
5. Check Sentry for spike in errors
6. Contact Vercel support if platform issue

**Rollback:**
```bash
# Via Vercel dashboard
# Go to: Deployments > Find last working deployment > "Redeploy"
```

---

### Critical: High Error Rate (Response: < 15 min)

**Symptoms:**
- Sentry alerts "> 10 errors/minute"
- Same error appearing repeatedly

**Steps:**
1. Open Sentry > Issues
2. Identify most frequent error
3. Check error details and stack trace
4. Review recent deployments
5. If regression: rollback to previous version
6. If new issue: create hotfix branch and deploy

---

### Warning: Slow API Response (Response: < 1 hour)

**Symptoms:**
- Sentry shows P95 > 2 seconds
- Users report slow voting

**Steps:**
1. Check Supabase query performance
2. Look for slow queries (> 500ms)
3. Review missing indexes
4. Check connection pool usage
5. Verify caching is working
6. Create issue for optimization

---

### Warning: Database Connection Issues (Response: < 30 min)

**Symptoms:**
- Errors: "Connection terminated unexpectedly"
- High connection pool usage

**Steps:**
1. Check Supabase connection pooler dashboard
2. Verify `?pgbouncer=true` in `DATABASE_URL`
3. Check active connection count
4. Review recent traffic spike
5. Check for connection leaks in code
6. Scale Supabase plan if needed

---

## 🛠️ Monitoring Utilities Usage

### Logger

```typescript
import { logger } from "@/lib/monitoring";

// Log informational message
logger.info("User voted", {
  userId: user.id,
  pollId: poll.id,
  action: "vote",
});

// Log error
logger.error("Vote failed", error, {
  userId: user.id,
  pollId: poll.id,
  metadata: { reason: "duplicate_vote" },
});

// Track metric
logger.metric("vote.success", 1, { pollId: poll.id });

// Track performance
logger.performance("vote.api_duration", 234, {
  pollId: poll.id,
  action: "cast_vote",
});
```

### Performance Tracking

```typescript
import { FlowMonitors, PerformanceTracker } from "@/lib/monitoring";

// Track voting flow
const result = await FlowMonitors.trackVoteFlow(
  pollId,
  userId,
  async () => {
    return await VotingService.castVote(data);
  }
);

// Custom performance tracking
const tracker = new PerformanceTracker("custom_operation");
// ... your code ...
tracker.end({ success: true });
```

### Database Monitoring

```typescript
import { monitorQuery, DatabaseMetrics } from "@/lib/monitoring";

// Monitor slow queries
const statements = await monitorQuery(
  "get_poll_statements",
  async () => {
    return await db.select().from(statements).where(...);
  },
  { pollId }
);

// Track database operations
DatabaseMetrics.trackVoteInsert(pollId, userId);
```

---

## 📈 Weekly Monitoring Routine

### Monday Morning Review (15 minutes)

1. **Check Uptime**
   - BetterStack dashboard
   - Target: 100% uptime last 7 days
   - Review any incidents

2. **Review Error Trends**
   - Sentry dashboard
   - Look for new error patterns
   - Resolve top 3 errors

3. **Performance Check**
   - Vercel Analytics > Speed Insights
   - Check Core Web Vitals scores
   - Compare to previous week

4. **Database Health**
   - Supabase > Query Performance
   - Review slowest queries
   - Check connection pool usage

5. **User Engagement**
   - Vercel Analytics > Audience
   - Traffic trends
   - Popular polls

---

## 🔧 Common Troubleshooting

### Sentry Not Receiving Events

```bash
# 1. Check environment variables
vercel env pull .env.local
grep SENTRY .env.local

# 2. Verify DSN
curl -X POST "https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/api/YOUR_PROJECT/envelope/" \
  -H "Content-Type: application/x-sentry-envelope" \
  -d $'{"event_id":"test123","sent_at":"2024-01-01T00:00:00.000Z"}\n{"type":"event"}\n{}'

# 3. Test in browser
# Open console and run:
throw new Error("Test Sentry");
```

### High Memory Usage

```bash
# Check Node.js memory
curl https://crowdsource.co.il/api/health/advanced | jq '.checks.memory'

# Expected: < 80% usage
# If high:
# 1. Check for memory leaks
# 2. Review recent code changes
# 3. Check Vercel function logs
```

### Database Connection Pool Exhausted

```bash
# Check current connections
# Go to: https://app.supabase.com/project/YOUR_PROJECT/database/pooler

# Verify DATABASE_URL includes pgbouncer
echo $DATABASE_URL | grep pgbouncer

# Should include: ?pgbouncer=true
```

---

## 📞 Emergency Contacts

| Issue | Contact | Response Time |
|-------|---------|---------------|
| Site Down | Vercel Support | < 1 hour |
| Database Issues | Supabase Support | < 2 hours |
| Security Issue | security@anthropic.com | Immediate |
| Critical Bug | Development Team | < 30 minutes |

---

## 🎯 Success Criteria

Your monitoring is healthy when:

- ✅ Uptime > 99.9% (last 30 days)
- ✅ Error rate < 0.1%
- ✅ P95 API response time < 500ms
- ✅ Core Web Vitals all "Good" (green)
- ✅ No critical Sentry issues
- ✅ All BetterStack monitors "Up"
- ✅ Database queries < 200ms P95
- ✅ Memory usage < 80%

---

## 📚 Documentation

- **Detailed Setup**: `.claude/docs/MONITORING.md`
- **Checklist**: `MONITORING_SETUP_CHECKLIST.md`
- **Environment Variables**: `.env.monitoring.example`
- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Vercel Docs**: https://vercel.com/docs/analytics

---

## 🔄 Version History

- **2025-10-19**: Initial monitoring infrastructure setup
- **Next**: Add PostHog for user behavior analytics (optional)
- **Future**: Implement predictive alerting and automated scaling

---

**Last Updated**: 2025-10-19
**Status**: Production Ready ✅
