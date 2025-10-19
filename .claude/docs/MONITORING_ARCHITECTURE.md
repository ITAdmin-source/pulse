# Monitoring Architecture

This document provides a visual overview of the monitoring infrastructure for the Pulse application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Pulse Application                            │
│                    https://crowdsource.co.il                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐      ┌───────────────────┐
        │   Client-Side     │      │   Server-Side     │
        │   (Browser)       │      │   (Vercel)        │
        └───────────────────┘      └───────────────────┘
                    │                           │
        ┌───────────┼───────────┐              │
        │           │           │              │
        ▼           ▼           ▼              ▼
    ┌──────┐  ┌──────┐  ┌──────┐        ┌──────────┐
    │Vercel│  │Sentry│  │Custom│        │  Sentry  │
    │Analytics│  (Client)│ Utils │        │ (Server) │
    └──────┘  └──────┘  └──────┘        └──────────┘
        │         │         │                   │
        └─────────┼─────────┴───────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  Monitoring Layer   │
        │  - Errors           │
        │  - Performance      │
        │  - User Analytics   │
        │  - Business Metrics │
        └─────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
    ┌──────┐  ┌──────┐  ┌──────┐
    │Vercel│  │Sentry│  │Better│
    │ Dash │  │ Dash │  │Stack │
    └──────┘  └──────┘  └──────┘
```

---

## Data Flow

### 1. User Interaction Tracking

```
User Action (Vote/Submit/View)
         │
         ▼
┌────────────────────┐
│ Custom Monitoring  │ → logger.userAction("vote", { pollId, userId })
│ lib/monitoring/    │
└────────────────────┘
         │
         ├──→ Development: console.log()
         │
         └──→ Production: Sentry.addBreadcrumb()
                         │
                         ▼
                   ┌──────────┐
                   │  Sentry  │ → Dashboard
                   │ Backend  │
                   └──────────┘
```

### 2. Error Tracking Flow

```
Error Occurs (Any Layer)
         │
         ▼
┌────────────────────┐
│   Error Handler    │
│ try/catch blocks   │
│ React error        │
│ boundaries         │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ logger.error()     │ → Enriched with context
│                    │   - userId, pollId
│                    │   - sessionId
│                    │   - action type
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ Sentry.capture     │ → With scope
│ Exception()        │   - User context
│                    │   - Tags (poll_id, etc.)
│                    │   - Breadcrumbs
└────────────────────┘
         │
         ▼
┌────────────────────┐
│  Sentry Dashboard  │ → Alerts
│  - Error details   │ → Email
│  - Stack trace     │ → Slack (optional)
│  - User context    │
│  - Session replay  │
└────────────────────┘
```

### 3. Performance Monitoring Flow

```
Critical User Flow (e.g., Voting)
         │
         ▼
┌────────────────────────────┐
│ FlowMonitors.trackVoteFlow │ → Start timer
│                            │
│  ┌──────────────────────┐  │
│  │ VotingService.cast   │  │
│  │ Vote()               │  │
│  └──────────────────────┘  │
│                            │
└────────────────────────────┘
         │
         ├──→ Success: logger.metric("vote.success", 1)
         │
         └──→ Failure: logger.metric("vote.failure", 1)
         │
         ▼
┌────────────────────┐
│ Performance Data   │
│ - Duration         │ → Sentry breadcrumb
│ - Success/Failure  │ → Business metrics
│ - Context          │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│   Sentry           │ → Performance dashboard
│   - P50, P95       │ → Alerts on slowness
│   - Trends         │
└────────────────────┘
```

### 4. Uptime Monitoring Flow

```
BetterStack Monitor (Every 60s)
         │
         ▼
GET /api/health/advanced
         │
         ▼
┌────────────────────────────┐
│  Health Check Handler      │
│                            │
│  1. Database connectivity  │ → SQL query
│  2. Connection pool status │ → pg_stat_activity
│  3. Memory usage           │ → process.memoryUsage()
│                            │
└────────────────────────────┘
         │
         ├──→ Status: healthy (200)
         │    └──→ BetterStack: Site is UP
         │
         └──→ Status: unhealthy (503)
              └──→ BetterStack: ALERT
                   └──→ Email/SMS to admin
```

### 5. Database Monitoring Flow

```
Database Query
         │
         ▼
┌────────────────────┐
│ monitorQuery()     │ → Wrap query
│                    │
│  ┌──────────────┐  │
│  │ db.select()  │  │ → Execute
│  └──────────────┘  │
│                    │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ Performance Check  │
│ - Duration > 1s?   │ → logger.warn("Slow query")
│ - Duration > 500ms?│ → logger.performance()
└────────────────────┘
         │
         ├──→ Sentry breadcrumb
         │
         └──→ Supabase query logs
              │
              ▼
         ┌────────────────┐
         │ Supabase       │ → Query performance
         │ Dashboard      │ → Suggest indexes
         └────────────────┘
```

---

## Monitoring Components

### 1. Vercel Analytics

**Tracks:**
- Page views
- Unique visitors
- Core Web Vitals (LCP, FID, CLS)
- Device distribution
- Geographic distribution

**Integration Point:**
```tsx
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

<Analytics />
<SpeedInsights />
```

**Data Flow:**
```
Page Load → Vercel Analytics SDK → Vercel API → Analytics Dashboard
```

---

### 2. Sentry Error Tracking

**Tracks:**
- JavaScript errors (client)
- Node.js errors (server)
- API route errors
- Server action errors
- Database query errors

**Integration Points:**
```typescript
// sentry.client.config.ts - Browser errors
Sentry.init({ dsn, integrations: [replay, browserTracing] })

// sentry.server.config.ts - Server errors
Sentry.init({ dsn, integrations: [postgres] })

// instrumentation.ts - Automatic instrumentation
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}
```

**Data Flow:**
```
Error → Sentry SDK → Enrich with context → Sentry API → Dashboard → Alerts
```

---

### 3. Custom Monitoring Utilities

**Provides:**
- Centralized logger
- Performance trackers
- Database monitors
- Business metrics

**Architecture:**
```
lib/monitoring/
├── logger.ts
│   └── logger.error(), logger.info(), logger.metric()
│
├── performance.ts
│   ├── measureAsync()
│   ├── PerformanceTracker
│   └── FlowMonitors
│       ├── trackVoteFlow()
│       ├── trackStatementSubmission()
│       └── trackResultsLoad()
│
├── database.ts
│   ├── monitorQuery()
│   └── DatabaseMetrics
│       ├── trackVoteInsert()
│       └── trackStatementInsert()
│
└── index.ts (exports)
```

**Usage Pattern:**
```typescript
// Wrap critical operations
const result = await FlowMonitors.trackVoteFlow(
  pollId,
  userId,
  async () => {
    return await VotingService.castVote(data);
  }
);
```

---

### 4. Health Check Endpoints

**Endpoints:**
```
/api/health/db
├── Tests database connection
├── Returns connection info
└── Response time: ~50-200ms

/api/health/advanced
├── Database health
├── Memory usage
├── Connection pool stats
└── Response time: ~100-500ms
```

**Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T12:00:00Z",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 123,
      "connectionInfo": {
        "activeConnections": 5,
        "idleConnections": 10
      }
    },
    "memory": {
      "used": 45000000,
      "total": 100000000,
      "percentage": 45
    }
  }
}
```

---

### 5. BetterStack Uptime Monitoring

**Monitors:**
```
Monitor 1: Main Site
├── URL: https://crowdsource.co.il
├── Interval: 60 seconds
├── Expected: 200 status
└── Alert: After 2 failures

Monitor 2: Health Check
├── URL: /api/health/advanced
├── Interval: 60 seconds
├── Expected: 200 + "healthy" in body
└── Alert: After 2 failures

Monitor 3: Database
├── URL: /api/health/db
├── Interval: 60 seconds
├── Expected: 200 + "connected":true
└── Alert: After 2 failures
```

**Alert Flow:**
```
Check fails → Retry (60s) → Still failing? → ALERT
                                              │
                                              ├─→ Email
                                              ├─→ SMS (optional)
                                              └─→ Slack (optional)
```

---

## Critical User Flows Monitored

### 1. Voting Flow

```
User clicks vote button
         │
         ▼
┌────────────────────────────┐
│ FlowMonitors.trackVoteFlow │ → Start tracking
└────────────────────────────┘
         │
         ▼
┌────────────────────────────┐
│ VotingService.castVote     │
│ 1. Validate statement      │ → monitorQuery("check_statement")
│ 2. Check existing vote     │ → monitorQuery("check_vote")
│ 3. Insert vote             │ → DatabaseMetrics.trackVoteInsert()
└────────────────────────────┘
         │
         ├──→ Success (< 2s)
         │    ├─→ logger.metric("vote.success")
         │    └─→ logger.userAction("vote")
         │
         └──→ Slow (> 2s)
              └─→ logger.warn("Slow vote detected", { duration })
```

**Metrics Tracked:**
- Vote success rate
- Vote API duration (P50, P95)
- Database insert time
- Errors by type (duplicate, not_found, poll_closed)

---

### 2. Results Loading Flow

```
User views results tab
         │
         ▼
┌──────────────────────────────┐
│ FlowMonitors.trackResultsLoad│ → Start tracking
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ PollResultsService.getResults│
│ 1. Check cache               │
│ 2. Fetch statements          │ → monitorQuery("get_statements")
│ 3. Fetch votes               │ → monitorQuery("get_votes")
│ 4. Calculate results         │
└──────────────────────────────┘
         │
         ├──→ Success (< 3s)
         │    └─→ logger.metric("results.loaded")
         │
         └──→ Slow (> 3s)
              └─→ logger.warn("Slow results loading", { duration })
```

---

## Alert Thresholds

### Critical Alerts (Immediate Response)

| Alert | Threshold | Channels | Response Time |
|-------|-----------|----------|---------------|
| Site Down | 2 failed health checks | Email + SMS | < 5 minutes |
| High Error Rate | > 10 errors/minute | Email + Slack | < 15 minutes |
| Database Down | Connection failure | Email + SMS | < 10 minutes |

### Warning Alerts (Check Within 1 Hour)

| Alert | Threshold | Channels | Response Time |
|-------|-----------|----------|---------------|
| Slow API Response | P95 > 2 seconds | Email | < 1 hour |
| High Memory | > 80% usage | Email | < 1 hour |
| Slow Queries | Duration > 1 second | Email (digest) | Next business day |

---

## Data Retention

| Service | Retention | Notes |
|---------|-----------|-------|
| Vercel Analytics | 30 days (free) | Upgrade for longer retention |
| Sentry (Errors) | 30 days | Upgrade for 90 days |
| Sentry (Performance) | 30 days | Sampled at 10% in production |
| BetterStack | 90 days | Uptime history |
| Supabase Logs | 7 days (free) | Query logs |

---

## Security & Privacy

### Data Anonymization

```typescript
// User IDs are hashed in Sentry
Sentry.setUser({
  id: hashUserId(userId), // Hashed ID
  // No email, name, or PII
});
```

### Sensitive Data Filtering

```typescript
// Filter out sensitive data before sending to Sentry
beforeSend(event) {
  // Remove potential PII from error messages
  if (event.message) {
    event.message = sanitize(event.message);
  }
  return event;
}
```

### GDPR Compliance

- Vercel Analytics: Cookieless, GDPR-compliant
- Sentry: Can be configured for GDPR (scrub PII)
- BetterStack: Uptime data only (no user PII)

---

## Scaling Considerations

### Current Capacity (Free Tiers)

- **Users**: Up to 50K-100K/month
- **Errors**: Up to 5K/month (Sentry)
- **Analytics Events**: Up to 100K/month (Vercel)
- **Health Checks**: Unlimited (self-hosted endpoints)

### When to Upgrade

**Sentry** ($26/month when):
- Error volume exceeds 5K/month
- Need longer retention (90 days)
- Want faster checks (<60s intervals)

**Vercel** (Already on Pro):
- Analytics included
- Speed Insights included

**BetterStack** ($20/month when):
- Need faster monitoring (<60s intervals)
- Need more than 10 monitors
- Want branded status page

---

## Performance Budgets

### Target Metrics

| Metric | Target | Alert If |
|--------|--------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | > 4s |
| FID (First Input Delay) | < 100ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 |
| API Response Time (P95) | < 500ms | > 2s |
| Database Query (P95) | < 200ms | > 1s |

### Enforcement

1. **Vercel Speed Insights**: Automatic tracking
2. **Sentry Performance**: Alerts on degradation
3. **Custom Budgets**: Can add Lighthouse CI (future)

---

## Monitoring Workflow

### Daily Routine (5 minutes)

1. Check Sentry for new errors
2. Review Vercel Analytics traffic
3. Verify BetterStack all green

### Weekly Review (15 minutes)

1. Review error trends
2. Check performance trends
3. Review slow query report
4. Update alert thresholds if needed

### Monthly Deep Dive (1 hour)

1. Analyze user behavior patterns
2. Identify optimization opportunities
3. Review capacity and scaling needs
4. Update monitoring strategy

---

## Troubleshooting Decision Tree

```
Is the site down?
├─ Yes → Check BetterStack monitors
│        ├─ All monitors down → Vercel issue
│        └─ Database monitor down → Supabase issue
│
└─ No → Check error type
         ├─ High error rate
         │   └─→ Check Sentry for error pattern
         │       ├─ Database errors → Check Supabase
         │       └─ Code errors → Review recent deploys
         │
         ├─ Slow performance
         │   └─→ Check Sentry Performance
         │       ├─ Slow API → Database query optimization
         │       └─ Slow frontend → Bundle size, Core Web Vitals
         │
         └─ Low traffic
             └─→ Check Vercel Analytics
                 └─→ Confirm this is expected (marketing, etc.)
```

---

## Related Documentation

- **Setup Guide**: `MONITORING_SETUP_CHECKLIST.md`
- **Quick Reference**: `MONITORING_QUICK_REFERENCE.md`
- **Full Documentation**: `.claude/docs/MONITORING.md`
- **Implementation Summary**: `MONITORING_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**Status**: Production Ready
