# Monitoring Setup Checklist

Use this checklist to set up production monitoring for Pulse step-by-step.

## Pre-Deployment Checklist

### 1. Environment Variables ✅

Add these to Vercel (https://vercel.com/YOUR_ORG/pulse/settings/environment-variables):

- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Get from https://sentry.io/settings/projects/pulse/keys/
- [ ] `SENTRY_ORG` - Your Sentry organization slug
- [ ] `SENTRY_PROJECT` - "pulse"
- [ ] `SENTRY_AUTH_TOKEN` - Get from https://sentry.io/settings/account/api/auth-tokens/
- [ ] `NEXT_PUBLIC_APP_VERSION` - "1.0.0"
- [ ] `NEXT_PUBLIC_APP_URL` - "https://crowdsource.co.il"

### 2. Code Changes ✅

- [x] Installed `@vercel/analytics` and `@vercel/speed-insights`
- [x] Installed `@sentry/nextjs`
- [x] Added Analytics and SpeedInsights to `app/layout.tsx`
- [x] Created Sentry config files (client, server, edge)
- [x] Created monitoring utilities (`lib/monitoring/`)
- [x] Created advanced health check endpoint
- [ ] **TODO**: Enable Sentry wrapper in `next.config.ts`

### 3. Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Add production monitoring infrastructure"
git push origin main

# Verify deployment
# Visit: https://vercel.com/YOUR_ORG/pulse/deployments
```

---

## Post-Deployment Setup

### 4. Sentry Setup (15 minutes)

1. **Create Sentry account:**
   - [ ] Go to https://sentry.io/signup/
   - [ ] Create organization
   - [ ] Create project: "Pulse" (Next.js platform)

2. **Configure project:**
   - [ ] Copy DSN from https://sentry.io/settings/projects/pulse/keys/
   - [ ] Create auth token: https://sentry.io/settings/account/api/auth-tokens/
     - Scopes: `project:releases`, `project:write`
   - [ ] Add both to Vercel environment variables

3. **Enable Sentry in code:**
   - [ ] Update `next.config.ts` to use Sentry wrapper (see docs)
   - [ ] Redeploy to Vercel

4. **Verify it works:**
   - [ ] Visit https://crowdsource.co.il
   - [ ] Open browser console, run: `throw new Error("Test Sentry");`
   - [ ] Check Sentry dashboard for the error

5. **Configure alerts:**
   - [ ] Go to https://sentry.io/settings/YOUR_ORG/projects/pulse/alerts/
   - [ ] Enable "Alert me on every new issue"
   - [ ] Add email: your-email@example.com

### 5. BetterStack Uptime Monitoring (10 minutes)

1. **Create account:**
   - [ ] Go to https://betterstack.com/signup
   - [ ] Verify email

2. **Create monitors:**

   **Monitor 1: Main Site**
   - [ ] Name: "Pulse - Main Site"
   - [ ] URL: `https://crowdsource.co.il`
   - [ ] Interval: 60 seconds
   - [ ] Expected: 200 status

   **Monitor 2: Health Check**
   - [ ] Name: "Pulse - Health Check"
   - [ ] URL: `https://crowdsource.co.il/api/health/advanced`
   - [ ] Interval: 60 seconds
   - [ ] Expected: 200 status + `"status":"healthy"` in body

   **Monitor 3: Database**
   - [ ] Name: "Pulse - Database"
   - [ ] URL: `https://crowdsource.co.il/api/health/db`
   - [ ] Interval: 60 seconds
   - [ ] Expected: 200 status + `"connected":true` in body

3. **Configure alerts:**
   - [ ] Add email notification: your-email@example.com
   - [ ] Set "Down after": 2 consecutive failures
   - [ ] (Optional) Add SMS for critical alerts

4. **Test alerts:**
   - [ ] Pause one monitor
   - [ ] Wait for alert
   - [ ] Verify you received email
   - [ ] Unpause monitor

### 6. Vercel Analytics (Already Active)

- [ ] Visit https://vercel.com/YOUR_ORG/pulse/analytics
- [ ] Verify traffic is showing up
- [ ] Check Core Web Vitals tab

### 7. Supabase Monitoring (5 minutes)

1. **Enable query logging:**
   - [ ] Go to https://app.supabase.com/project/YOUR_PROJECT/database/query-performance
   - [ ] Enable "Log slow queries" (> 100ms)

2. **Check connection pool:**
   - [ ] Go to https://app.supabase.com/project/YOUR_PROJECT/database/pooler
   - [ ] Verify PgBouncer is enabled
   - [ ] Check connection count is reasonable (< 100)

3. **Review indexes:**
   - [ ] Go to https://app.supabase.com/project/YOUR_PROJECT/database/indexes
   - [ ] Look for missing indexes on high-traffic tables

---

## Verification Checklist

### Test Each Monitor

#### 1. Vercel Analytics
- [ ] Visit https://crowdsource.co.il
- [ ] Navigate to a poll
- [ ] Cast a vote
- [ ] Check analytics dashboard shows page views

#### 2. Sentry Error Tracking
- [ ] Open browser console
- [ ] Run: `throw new Error("Test error");`
- [ ] Check Sentry dashboard for error
- [ ] Verify source maps show correct line numbers

#### 3. Sentry Performance
- [ ] Navigate several pages on site
- [ ] Check Sentry Performance dashboard
- [ ] Verify transaction traces are showing

#### 4. BetterStack Uptime
- [ ] Check all monitors show "Up"
- [ ] Verify response times are reasonable (< 500ms)
- [ ] Check uptime percentage is 100%

#### 5. Health Check Endpoints
```bash
# Test basic health check
curl https://crowdsource.co.il/api/health/db
# Expected: {"status":"healthy",...}

# Test advanced health check
curl https://crowdsource.co.il/api/health/advanced
# Expected: {"status":"healthy","checks":{...}}
```

#### 6. Custom Monitoring
- [ ] Cast a vote and check Sentry for `vote.success` metric
- [ ] Submit a statement and check for `statement.submitted` metric
- [ ] Check performance traces for database queries

---

## Dashboard Setup

### Sentry Dashboard (10 minutes)

1. **Create custom dashboard:**
   - [ ] Go to https://sentry.io/organizations/YOUR_ORG/dashboards/
   - [ ] Click "Create Dashboard"
   - [ ] Name: "Pulse - Production"

2. **Add widgets:**
   - [ ] Error rate (last 24h)
   - [ ] Top 10 errors
   - [ ] P95 performance (transaction duration)
   - [ ] Database query performance
   - [ ] Vote success rate

3. **Save as default:**
   - [ ] Click "Set as Default Dashboard"

### BetterStack Status Page (Optional, 15 minutes)

1. **Create status page:**
   - [ ] Go to BetterStack > Status Pages
   - [ ] Create new page
   - [ ] Name: "Pulse Status"

2. **Configure:**
   - [ ] Select monitors to display
   - [ ] Upload logo
   - [ ] Set colors (purple/pink theme)

3. **Set up domain (optional):**
   - [ ] Add DNS CNAME: status.crowdsource.co.il → betterstack
   - [ ] Wait for DNS propagation

---

## Alert Configuration

### Critical Alerts (Immediate Response)

- [ ] **Site Down** (BetterStack)
  - Trigger: 2 failed checks
  - Channels: Email + SMS
  - Response time: < 5 minutes

- [ ] **High Error Rate** (Sentry)
  - Trigger: > 10 errors/min
  - Channels: Email + Slack
  - Response time: < 15 minutes

- [ ] **Database Connection Failure** (Sentry)
  - Trigger: Any database connection error
  - Channels: Email + Slack
  - Response time: < 10 minutes

### Warning Alerts (Check Within 1 Hour)

- [ ] **Slow API Response** (Sentry)
  - Trigger: P95 > 2 seconds
  - Channels: Email
  - Response time: < 1 hour

- [ ] **Slow Database Queries** (Supabase)
  - Trigger: Query > 1 second
  - Channels: Email (daily digest)
  - Response time: Next business day

---

## Integration Checklist

### Add Monitoring to Critical Flows

#### Voting Flow
- [ ] Import monitoring utilities
- [ ] Wrap vote action with `FlowMonitors.trackVoteFlow()`
- [ ] Add success/failure metrics
- [ ] Add performance tracking

#### Statement Submission
- [ ] Wrap submission with `FlowMonitors.trackStatementSubmission()`
- [ ] Track approval rate
- [ ] Monitor submission errors

#### Results Loading
- [ ] Wrap results fetch with `FlowMonitors.trackResultsLoad()`
- [ ] Monitor cache hit rate
- [ ] Track load performance

#### Demographics Collection
- [ ] Track submission with `FlowMonitors.trackDemographicsSubmission()`
- [ ] Monitor completion rate
- [ ] Track validation errors

---

## Maintenance Checklist (Weekly)

### Every Monday Morning

- [ ] Review Sentry error trends (last 7 days)
- [ ] Check BetterStack uptime percentage (target: > 99.9%)
- [ ] Review Supabase slow query report
- [ ] Check Vercel Analytics for traffic patterns
- [ ] Review Core Web Vitals scores

### Monthly Review

- [ ] Review Sentry performance trends
- [ ] Analyze vote success rate
- [ ] Check database growth and plan scaling
- [ ] Review and update alert thresholds
- [ ] Update monitoring documentation

---

## Troubleshooting

### Sentry Not Working

1. Check DSN is set correctly in Vercel
2. Verify `instrumentation.ts` exists in root
3. Check browser network tab for Sentry requests
4. Test with: `throw new Error("Test");` in console

### BetterStack False Alerts

1. Increase "Down after" to 3 failures
2. Check timeout setting (30 seconds)
3. Test endpoint manually: `curl https://crowdsource.co.il/api/health/db`

### High Memory Usage

1. Check Supabase connection pool
2. Review recent code changes
3. Check for memory leaks in components
4. Monitor Node.js heap usage

### Slow Queries

1. Check Supabase query performance dashboard
2. Review missing indexes
3. Analyze N+1 query patterns
4. Consider query optimization

---

## Success Criteria

Your monitoring is fully operational when:

- [x] Vercel Analytics shows real-time traffic
- [ ] Sentry receives and displays errors
- [ ] Sentry shows performance traces
- [ ] BetterStack monitors show "Up" status
- [ ] Health check endpoints return 200
- [ ] Custom metrics appear in Sentry
- [ ] Alerts are configured and tested
- [ ] Team receives test alerts successfully

---

## Next Steps After Setup

1. **Week 1**: Monitor daily, tune alert thresholds
2. **Week 2**: Add custom monitoring to more flows
3. **Week 3**: Analyze patterns, optimize slow queries
4. **Month 2**: Set up advanced analytics (PostHog, etc.)
5. **Ongoing**: Regular reviews, continuous optimization

---

## Questions?

- Check `.claude/docs/MONITORING.md` for detailed guide
- Review Sentry docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Ask in Slack: #pulse-monitoring (if applicable)

---

**Last Updated**: 2025-10-19
**Status**: Ready for production deployment
