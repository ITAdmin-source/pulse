# Production Monitoring & Analytics Guide

This guide covers the complete monitoring setup for the Pulse polling application, including error tracking, performance monitoring, user analytics, and uptime monitoring.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Monitoring Stack](#monitoring-stack)
4. [Setup Instructions](#setup-instructions)
5. [Dashboard Configuration](#dashboard-configuration)
6. [Alert Configuration](#alert-configuration)
7. [Monitoring Critical Flows](#monitoring-critical-flows)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Monitoring Philosophy

Our monitoring strategy follows the **observability pyramid**:

1. **Foundation (Critical)**: Error tracking, uptime monitoring, database health
2. **Performance (High Priority)**: API response times, page load speed, query performance
3. **User Behavior (Medium Priority)**: Analytics, session replay, engagement metrics
4. **Business Metrics (Nice-to-have)**: Vote conversion rates, poll completion rates

### Key Metrics We Track

**Technical Metrics:**
- Error rates and types
- API endpoint response times
- Database query performance
- Connection pool health
- Core Web Vitals (LCP, FID, CLS)
- Server-side rendering performance

**Business Metrics:**
- Vote submission success rate
- Statement submission rate
- Demographics completion rate
- Poll completion rate (10+ votes)
- Anonymous to authenticated upgrade rate

**User Experience Metrics:**
- Page load times per route
- Mobile vs desktop performance
- Hebrew text rendering performance
- Real-time voting responsiveness

---

## Quick Start

### Prerequisites

1. **Vercel Account** (you already have this)
2. **Sentry Account** (free tier: 5K errors/month)
3. **BetterStack Account** (free tier: 10 monitors)

### 5-Minute Setup

```bash
# 1. Install monitoring packages (already done)
npm install @vercel/analytics @vercel/speed-insights @sentry/nextjs

# 2. Set up Sentry account
# Visit: https://sentry.io/signup/
# Create project: "Pulse" (Next.js)

# 3. Add environment variables to Vercel
# Go to: https://vercel.com/YOUR_ORG/pulse/settings/environment-variables

NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/PROJECT_ID
SENTRY_ORG=your-org-name
SENTRY_PROJECT=pulse
SENTRY_AUTH_TOKEN=your_auth_token

# 4. Deploy to Vercel
git add .
git commit -m "Add production monitoring"
git push origin main

# 5. Verify monitoring is working
# Visit: https://crowdsource.co.il
# Check Sentry dashboard for first events
```

---

## Monitoring Stack

### 1. Vercel Analytics (Built-in) ✅

**What it monitors:**
- Core Web Vitals (LCP, FID, CLS)
- Page views and unique visitors
- Top pages and referrers
- Real User Monitoring (RUM)

**Cost:** Free on Vercel Pro plan

**Setup:**
Already integrated in `app/layout.tsx`:
```tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// In your layout
<Analytics />
<SpeedInsights />
```

**Dashboard:**
- Go to: https://vercel.com/YOUR_ORG/pulse/analytics
- View real-time traffic and performance

**Best for:**
- Quick performance overview
- Traffic patterns
- Core Web Vitals tracking

---

### 2. Sentry (Error Tracking & APM) 🚨

**What it monitors:**
- JavaScript errors (client-side)
- Server errors (API routes, server actions)
- Performance metrics (transaction traces)
- Session replay (visual debugging)
- Database query performance

**Cost:** Free tier: 5K errors/month (sufficient for 50K users)

**Setup:**

1. **Create Sentry account:**
   - Go to: https://sentry.io/signup/
   - Create organization
   - Create project: "Pulse" (Next.js)

2. **Get your DSN:**
   - Copy from: https://sentry.io/settings/projects/pulse/keys/

3. **Configure Vercel environment variables:**
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
   SENTRY_ORG=your-org-name
   SENTRY_PROJECT=pulse
   SENTRY_AUTH_TOKEN=your_auth_token  # For source maps
   ```

4. **Enable Sentry config:**
   ```bash
   # Rename the Sentry-wrapped config
   mv next.config.sentry.ts next.config.ts.bak
   mv next.config.ts next.config.old.ts
   mv next.config.ts.bak next.config.ts
   ```

5. **Deploy and verify:**
   - Push to GitHub
   - Check Sentry dashboard for first events

**Dashboard:**
- Errors: https://sentry.io/organizations/YOUR_ORG/issues/
- Performance: https://sentry.io/organizations/YOUR_ORG/performance/
- Replays: https://sentry.io/organizations/YOUR_ORG/replays/

**Best for:**
- Production error tracking
- Performance bottleneck identification
- Visual debugging with session replay
- Database query optimization

---

### 3. BetterStack Uptime Monitoring ⏰

**What it monitors:**
- Website uptime (ping every 30-60 seconds)
- API endpoint availability
- Response time trends
- SSL certificate expiration

**Cost:** Free tier: 10 monitors, 60-second checks

**Setup:**

1. **Create account:**
   - Go to: https://betterstack.com/signup
   - Verify email

2. **Create monitors:**

   **Monitor 1: Main Site**
   - Name: "Pulse - Main Site"
   - URL: `https://crowdsource.co.il`
   - Check interval: 60 seconds
   - Expected status: 200

   **Monitor 2: Health Check**
   - Name: "Pulse - Database Health"
   - URL: `https://crowdsource.co.il/api/health/advanced`
   - Check interval: 60 seconds
   - Expected status: 200
   - Advanced: Assert JSON contains `"status": "healthy"`

   **Monitor 3: API - Vote Endpoint**
   - Name: "Pulse - Vote API"
   - URL: `https://crowdsource.co.il/api/health/db`
   - Check interval: 60 seconds
   - Expected status: 200

3. **Configure alerts:**
   - Email: your-email@example.com
   - SMS (optional): +972-5X-XXX-XXXX
   - Slack (optional): #pulse-alerts

4. **Set up status page (optional):**
   - Create public status page at: status.crowdsource.co.il
   - Show uptime percentage

**Dashboard:**
- https://betterstack.com/uptime

**Best for:**
- Immediate downtime alerts
- Uptime SLA tracking
- Public status page
- Historical uptime data

---

### 4. Supabase Monitoring (Database) 🗄️

**What it monitors:**
- Query performance and slow queries
- Connection pool usage
- Database size and growth
- Index usage and recommendations
- Row-level security policy hits

**Cost:** Included with Supabase free tier

**Setup:**

1. **Enable query logging:**
   - Go to: https://app.supabase.com/project/YOUR_PROJECT/database/query-performance
   - Enable "Log slow queries" (queries > 100ms)

2. **Monitor connection pool:**
   - Go to: https://app.supabase.com/project/YOUR_PROJECT/database/pooler
   - View active connections
   - Check pool utilization

3. **Review indexes:**
   - Go to: https://app.supabase.com/project/YOUR_PROJECT/database/indexes
   - Look for missing indexes on high-traffic tables

**Dashboard:**
- Query Performance: https://app.supabase.com/project/YOUR_PROJECT/database/query-performance
- Connection Pooler: https://app.supabase.com/project/YOUR_PROJECT/database/pooler

**Best for:**
- Identifying slow queries
- Connection pool optimization
- Database growth tracking
- Index recommendations

---

## Setup Instructions

### Step 1: Enable Vercel Analytics (Already Done ✅)

Vercel Analytics is already integrated in your `app/layout.tsx`. No additional setup needed.

**Verify it's working:**
1. Deploy to Vercel
2. Visit https://crowdsource.co.il
3. Check https://vercel.com/YOUR_ORG/pulse/analytics

---

### Step 2: Configure Sentry

#### A. Create Sentry Project

1. Go to https://sentry.io/signup/
2. Create account and organization
3. Create new project:
   - Platform: Next.js
   - Project name: "Pulse"
   - Alert frequency: "Alert me on every new issue"

#### B. Get Configuration Values

1. **DSN**: Copy from https://sentry.io/settings/projects/pulse/keys/
   ```
   Example: https://abc123def456@o123456.ingest.sentry.io/123456
   ```

2. **Auth Token**: Create from https://sentry.io/settings/account/api/auth-tokens/
   - Name: "Vercel Source Maps"
   - Scopes: "project:releases", "project:write"
   - Save token securely

3. **Org & Project slugs**: From your Sentry URL
   ```
   URL: https://sentry.io/organizations/YOUR_ORG/projects/pulse/
   Org: YOUR_ORG
   Project: pulse
   ```

#### C. Add Environment Variables to Vercel

1. Go to https://vercel.com/YOUR_ORG/pulse/settings/environment-variables

2. Add the following variables (for all environments: Production, Preview, Development):

   ```
   NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=pulse
   SENTRY_AUTH_TOKEN=your_auth_token
   ```

3. **Important**: Mark `SENTRY_AUTH_TOKEN` as "Sensitive" (hide value in UI)

#### D. Enable Sentry Configuration

The Sentry config files are already created. To enable them:

1. **Update next.config.ts** to use Sentry wrapper:

   ```bash
   # Backup current config
   cp next.config.ts next.config.no-sentry.ts

   # Use Sentry config
   cp next.config.sentry.ts next.config.ts
   ```

   Alternatively, manually wrap your existing config:
   ```typescript
   import { withSentryConfig } from "@sentry/nextjs";
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     // Your existing config...
   };

   export default withSentryConfig(nextConfig, {
     org: process.env.SENTRY_ORG,
     project: process.env.SENTRY_PROJECT,
     silent: !process.env.CI,
     widenClientFileUpload: true,
     hideSourceMaps: true,
     disableLogger: true,
   });
   ```

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Enable Sentry monitoring"
   git push origin main
   ```

#### E. Verify Sentry is Working

1. Visit https://crowdsource.co.il
2. Open browser console and run:
   ```javascript
   throw new Error("Test Sentry error tracking");
   ```
3. Check Sentry dashboard: https://sentry.io/organizations/YOUR_ORG/issues/
4. You should see the test error appear within 30 seconds

---

### Step 3: Set Up Uptime Monitoring (BetterStack)

#### A. Create Account

1. Go to https://betterstack.com/signup
2. Sign up (free tier)
3. Verify email

#### B. Create Monitors

**Monitor 1: Main Website**

1. Click "Add Monitor"
2. Configure:
   - **Type**: HTTP
   - **Name**: "Pulse - Main Site"
   - **URL**: `https://crowdsource.co.il`
   - **Check interval**: 60 seconds (free tier)
   - **Expected status code**: 200
   - **Timeout**: 30 seconds
   - **Regions**: Choose closest to Israel (Europe)

**Monitor 2: Health Check API**

1. Click "Add Monitor"
2. Configure:
   - **Type**: HTTP
   - **Name**: "Pulse - Health Check"
   - **URL**: `https://crowdsource.co.il/api/health/advanced`
   - **Check interval**: 60 seconds
   - **Expected status code**: 200
   - **Advanced checks**:
     - Response body contains: `"status":"healthy"`
     - Response time < 1000ms

**Monitor 3: Database Health**

1. Click "Add Monitor"
2. Configure:
   - **Type**: HTTP
   - **Name**: "Pulse - Database"
   - **URL**: `https://crowdsource.co.il/api/health/db`
   - **Check interval**: 60 seconds
   - **Expected status code**: 200
   - **Advanced checks**:
     - Response body contains: `"connected":true`

#### C. Configure Alerts

1. Go to "Integrations"
2. Add email notification:
   - Email: your-email@example.com
   - Alerts: "On incident start and resolve"

3. (Optional) Add Slack:
   - Connect Slack workspace
   - Choose channel: #pulse-alerts
   - Test notification

4. (Optional) Add SMS:
   - Phone: +972-5X-XXX-XXXX
   - Only for critical alerts

#### D. Set Alert Thresholds

1. Go to "Monitor Settings"
2. Configure:
   - **Down after**: 2 consecutive failures (avoid false positives)
   - **Up after**: 1 successful check
   - **Incident reminders**: Every 30 minutes if still down

---

### Step 4: Initialize Custom Monitoring

Add monitoring initialization to your app:

1. **Update `app/layout.tsx`**:

   ```typescript
   import { initializeMonitoring } from "@/lib/monitoring";

   // In your root layout, after other imports
   if (typeof window !== "undefined") {
     initializeMonitoring();
   }
   ```

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Initialize custom monitoring"
   git push origin main
   ```

---

## Dashboard Configuration

### Sentry Dashboard Setup

1. **Create custom dashboard:**
   - Go to: https://sentry.io/organizations/YOUR_ORG/dashboards/
   - Click "Create Dashboard"
   - Name: "Pulse - Production Overview"

2. **Add widgets:**

   **Widget 1: Error Rate**
   - Type: Line chart
   - Metric: Number of errors
   - Group by: Environment, Error type
   - Time range: Last 24 hours

   **Widget 2: Top Errors**
   - Type: Table
   - Columns: Error message, Count, Last seen
   - Sort by: Count (descending)
   - Limit: 10

   **Widget 3: Performance (P95)**
   - Type: Line chart
   - Metric: Transaction duration (P95)
   - Group by: Transaction name
   - Filter: Transaction type = "pageload"

   **Widget 4: Vote Success Rate**
   - Type: Number
   - Metric: Custom metric "vote.success"
   - Calculation: Rate over time

   **Widget 5: Database Performance**
   - Type: Line chart
   - Metric: Database query duration (P95)
   - Group by: Query name
   - Filter: Database queries only

3. **Save and set as default dashboard**

### Vercel Analytics Dashboard

Vercel's built-in dashboard shows:
- Real-time visitors
- Top pages
- Core Web Vitals (LCP, FID, CLS)
- Traffic sources

**Recommended views:**
- **Performance tab**: Monitor Core Web Vitals
- **Audience tab**: Track user demographics
- **Conversion events**: Set up custom events (optional)

### BetterStack Dashboard

Configure your status page:

1. Go to "Status Pages"
2. Create new status page:
   - Name: "Pulse Status"
   - Domain: status.crowdsource.co.il (configure DNS)
   - Monitors to show: All 3 monitors
   - Show uptime: Last 90 days

3. Customize:
   - Logo: Upload Pulse logo
   - Colors: Match brand (purple/pink)
   - Language: Hebrew (if available)

---

## Alert Configuration

### Critical Alerts (Immediate Action Required)

**1. Site Down (BetterStack)**
- **Trigger**: 2 consecutive failed health checks
- **Channels**: Email + SMS
- **Response**: Investigate immediately, check Vercel deployment logs

**2. High Error Rate (Sentry)**
- **Trigger**: > 10 errors per minute
- **Channels**: Email + Slack
- **Response**: Check Sentry dashboard, identify error pattern

**3. Database Connection Failure (Sentry)**
- **Trigger**: Database connection errors
- **Channels**: Email + Slack
- **Response**: Check Supabase status, verify connection pool

### Warning Alerts (Check Within 1 Hour)

**4. Slow API Response (Sentry)**
- **Trigger**: P95 latency > 2 seconds
- **Channels**: Email
- **Response**: Check database query performance, review recent changes

**5. High Memory Usage (Custom)**
- **Trigger**: Memory usage > 80%
- **Channels**: Email
- **Response**: Check Vercel function logs, review memory leaks

**6. Slow Database Queries (Supabase)**
- **Trigger**: Query duration > 1 second
- **Channels**: Email (daily digest)
- **Response**: Review query patterns, add indexes

### Informational Alerts (Review Daily)

**7. Vote Failure Rate Increase (Sentry)**
- **Trigger**: Vote failure rate > 5%
- **Channels**: Email (daily digest)
- **Response**: Review vote validation logic, check for spam

**8. Certificate Expiration (BetterStack)**
- **Trigger**: SSL certificate expires in < 30 days
- **Channels**: Email
- **Response**: Vercel auto-renews, but verify

---

## Monitoring Critical Flows

### 1. Voting Flow Monitoring

**Key Metrics:**
- Vote submission success rate
- Vote API response time
- Database insert performance
- Vote value distribution (agree/disagree/pass)

**Implementation:**

```typescript
import { FlowMonitors, logger } from "@/lib/monitoring";

// In your vote action
export async function castVote(data: VoteData) {
  try {
    const result = await FlowMonitors.trackVoteFlow(
      data.pollId,
      data.userId,
      async () => {
        // Your existing vote logic
        return await VotingService.castVote(data);
      }
    );

    logger.metric("vote.success", 1, { pollId: data.pollId });
    return { success: true, data: result };
  } catch (error) {
    logger.error("Vote failed", error as Error, {
      pollId: data.pollId,
      userId: data.userId,
    });
    logger.metric("vote.failure", 1, { pollId: data.pollId });
    throw error;
  }
}
```

### 2. Statement Submission Monitoring

**Key Metrics:**
- Statement submission rate
- Approval rate
- Submission API response time

**Implementation:**

```typescript
import { FlowMonitors, logger } from "@/lib/monitoring";

export async function submitStatement(data: StatementData) {
  const result = await FlowMonitors.trackStatementSubmission(
    data.pollId,
    data.userId,
    async () => {
      return await StatementService.create(data);
    }
  );

  logger.userAction("submit_statement", {
    pollId: data.pollId,
    userId: data.userId,
  });

  return result;
}
```

### 3. Results Loading Monitoring

**Key Metrics:**
- Results page load time
- Results API response time
- Cache hit rate

**Implementation:**

```typescript
import { FlowMonitors } from "@/lib/monitoring";

export async function getResults(pollId: string, userId?: string) {
  return await FlowMonitors.trackResultsLoad(
    pollId,
    userId,
    async () => {
      return await PollResultsService.getResults(pollId, userId);
    }
  );
}
```

### 4. Demographics Collection Monitoring

**Key Metrics:**
- Demographics completion rate
- Form validation errors
- Submission success rate

**Implementation:**

```typescript
import { logger } from "@/lib/monitoring";

export async function submitDemographics(data: DemographicsData) {
  try {
    const result = await UserService.updateDemographics(data);

    logger.metric("demographics.submitted", 1, {
      pollId: data.pollId,
      userId: data.userId,
    });

    FlowMonitors.trackDemographicsSubmission(data.pollId, data.userId);

    return { success: true };
  } catch (error) {
    logger.error("Demographics submission failed", error as Error, {
      pollId: data.pollId,
      userId: data.userId,
    });

    logger.metric("demographics.failed", 1, { pollId: data.pollId });
    throw error;
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Sentry Not Receiving Events

**Symptoms:**
- No errors showing in Sentry dashboard
- Source maps not uploaded

**Solutions:**

1. **Verify DSN is correct:**
   ```bash
   # Check Vercel environment variables
   vercel env pull .env.local
   cat .env.local | grep SENTRY
   ```

2. **Check instrumentation is loaded:**
   - Open browser DevTools > Network tab
   - Look for requests to `sentry.io`
   - If missing, check `instrumentation.ts` is in root directory

3. **Verify source maps upload:**
   ```bash
   # Check build logs
   npm run build

   # Look for:
   # [sentry-webpack-plugin] Uploading source maps...
   ```

4. **Test error manually:**
   ```javascript
   // In browser console
   throw new Error("Test Sentry");
   ```

#### 2. High Memory Usage Warnings

**Symptoms:**
- Memory percentage > 80% in health checks
- Vercel functions timing out

**Solutions:**

1. **Check for memory leaks:**
   ```typescript
   // Add to suspicious components
   useEffect(() => {
     console.log("Component mounted");
     return () => {
       console.log("Component unmounted");
       // Ensure cleanup of subscriptions, timers, etc.
     };
   }, []);
   ```

2. **Review Supabase connection pooling:**
   - Ensure `?pgbouncer=true` in `DATABASE_URL`
   - Check connection count in Supabase dashboard

3. **Optimize data fetching:**
   - Use pagination for large datasets
   - Implement cursor-based pagination for results

#### 3. Slow Database Queries

**Symptoms:**
- Health check reports "slow" database
- Query duration > 500ms

**Solutions:**

1. **Check Supabase query performance:**
   - Go to: https://app.supabase.com/project/YOUR_PROJECT/database/query-performance
   - Review slowest queries

2. **Add missing indexes:**
   ```sql
   -- Example: Add index on votes.user_id
   CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

   -- Check index usage
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   ORDER BY idx_scan ASC;
   ```

3. **Optimize N+1 queries:**
   ```typescript
   // Bad: N+1 query
   const statements = await getStatements(pollId);
   for (const statement of statements) {
     statement.votes = await getVotes(statement.id); // N queries
   }

   // Good: Join or batch query
   const statementsWithVotes = await db
     .select()
     .from(statements)
     .leftJoin(votes, eq(statements.id, votes.statementId))
     .where(eq(statements.pollId, pollId));
   ```

#### 4. BetterStack False Positives

**Symptoms:**
- Uptime alerts but site is actually up
- Intermittent failures

**Solutions:**

1. **Increase failure threshold:**
   - Monitor Settings > Down after: 3 consecutive failures
   - This gives more tolerance for temporary issues

2. **Check timeout settings:**
   - Increase timeout to 30 seconds
   - Some health checks might be slow during deployments

3. **Verify health check endpoint:**
   ```bash
   # Test manually
   curl -i https://crowdsource.co.il/api/health/advanced

   # Should return:
   # HTTP/2 200
   # Content-Type: application/json
   # {"status":"healthy",...}
   ```

---

## Next Steps

### Phase 1: Immediate (Week 1)
- [x] Enable Vercel Analytics
- [x] Set up Sentry error tracking
- [x] Configure BetterStack uptime monitoring
- [x] Create health check endpoints

### Phase 2: Short-term (Week 2-3)
- [ ] Add custom monitoring to critical flows (voting, statements)
- [ ] Set up Sentry alerts for critical errors
- [ ] Configure BetterStack status page
- [ ] Review and optimize slow queries in Supabase

### Phase 3: Medium-term (Month 1-2)
- [ ] Add PostHog for user behavior analytics (optional)
- [ ] Set up conversion funnel tracking
- [ ] Create custom Sentry dashboard for business metrics
- [ ] Implement A/B testing for key features

### Phase 4: Long-term (Month 3+)
- [ ] Set up automated performance budgets
- [ ] Implement predictive alerting
- [ ] Create runbooks for common incidents
- [ ] Set up quarterly performance reviews

---

## Additional Resources

- **Sentry Documentation**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Vercel Analytics**: https://vercel.com/docs/concepts/analytics
- **BetterStack Guide**: https://betterstack.com/docs/uptime/
- **Supabase Monitoring**: https://supabase.com/docs/guides/platform/metrics

---

**Questions or Issues?**
Check the main CLAUDE.md file or create an issue in the repository.
