# Pulse - Quick Deployment Notes

## Quick Reference

**Status:** Ready for production deployment
**Deployment Platform:** Vercel (recommended)
**Database:** Supabase PostgreSQL (already configured)
**Authentication:** Clerk (need production keys)

---

## Pre-Deployment Checklist

- [x] Build compiles successfully (`npm run build`)
- [x] ESLint warnings fixed
- [x] Security headers configured (HSTS, CSP, X-Frame-Options)
- [x] Test routes blocked in production
- [x] Production health check endpoint created
- [x] Database performance indexes ready
- [ ] Create production Clerk application
- [ ] Set up Vercel project
- [ ] Configure production environment variables
- [ ] Run database indexes in Supabase
- [ ] Deploy to Vercel

---

## Step 1: Create Production Clerk App

1. Go to https://dashboard.clerk.com/
2. Click "Add application"
3. Name: "Pulse Production" (or your preferred name)
4. Copy your production keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_...`)
   - `CLERK_SECRET_KEY` (starts with `sk_live_...`)
5. Keep these keys secure - you'll add them to Vercel in the next step

---

## Step 2: Run Database Performance Indexes

**Before deploying**, run the performance indexes in your Supabase database:

1. Go to Supabase Dashboard > SQL Editor
2. Open the file `db/manual-migrations/performance-indexes.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click "Run"
6. Verify indexes were created (query at bottom of file shows results)

**Why:** These indexes optimize high-traffic queries for votes, statements, and polls.

---

## Step 3: Deploy to Vercel

### 3.1 Create Vercel Project

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Project Settings:
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm ci`

### 3.2 Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add these for **Production** environment:

```bash
# Database (from Supabase Dashboard > Settings > Database > Connection Pooling)
DATABASE_URL=postgresql://postgres.YOUR_REF:YOUR_PASSWORD@YOUR_REF.pooler.supabase.com:5432/postgres

# Clerk (from Step 1 above)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup

# OpenAI (optional - for AI insights)
OPENAI_API_KEY=sk-proj-YOUR_PRODUCTION_KEY
```

**Important:** Set environment to "Production" (not Preview or Development)

### 3.3 Deploy

1. Click "Deploy" in Vercel dashboard
2. Wait for build to complete (3-5 minutes)
3. Your app will be live at `https://your-app.vercel.app`

---

## Step 4: Post-Deployment Verification

### Quick Health Check

1. Visit: `https://your-app.vercel.app/api/health/production`
2. Expected response:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "timestamp": "2025-...",
     "environment": "production"
   }
   ```

### Smoke Test Checklist

- [ ] Homepage loads (`/`)
- [ ] Polls list loads (`/polls`)
- [ ] Login works (`/login`)
- [ ] Sign up works (`/signup`)
- [ ] Can create a poll (authenticated)
- [ ] Can vote on a poll (anonymous or authenticated)
- [ ] Results display after 10 votes
- [ ] Demographics modal appears
- [ ] AI insights generate successfully

### Test Routes Blocked?

- [ ] Try visiting `/test-auth` - should redirect to `/unauthorized`

---

## Step 5: Monitoring Setup (Optional but Recommended)

### Enable Vercel Analytics (Free)

1. Go to Vercel Dashboard > Analytics tab
2. Click "Enable Analytics"
3. Provides Core Web Vitals, page views, and performance metrics

### Set Up Uptime Monitoring (Free)

Use any of these free services:
- **UptimeRobot** (https://uptimerobot.com) - 50 monitors free
- **Pingdom** (https://www.pingdom.com) - 1 site free
- **Better Uptime** (https://betteruptime.com) - 3 monitors free

**Monitor URL:** `https://your-app.vercel.app/api/health/production`
**Check Interval:** 5 minutes
**Alert on:** Status code ≠ 200

---

## Rollback Procedure

If something goes wrong after deployment:

### Quick Rollback (Vercel Dashboard)

1. Go to Vercel Dashboard > Deployments
2. Find last known good deployment
3. Click "..." menu > "Promote to Production"
4. Takes ~30 seconds

### Rollback via Git

```bash
# Revert last commit
git revert HEAD
git push origin ux-redesign

# Vercel will auto-deploy the reverted code
```

---

## Security Notes

### Credentials Rotation

**After first deployment**, it's recommended to rotate these credentials for security:

1. **Supabase Database Password:**
   - Go to Supabase > Settings > Database
   - Click "Reset database password"
   - Update `DATABASE_URL` in Vercel

2. **OpenAI API Key:**
   - Go to OpenAI Dashboard > API Keys
   - Create new key labeled "Pulse Production"
   - Update `OPENAI_API_KEY` in Vercel

### Never Commit Secrets

- `.env.local` is in `.gitignore` - never commit it
- Use `.env.production.example` as template (safe to commit)
- All real secrets go in Vercel environment variables

---

## Estimated Costs (Month 1)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Free (Hobby) | $0 |
| Supabase | Free | $0 |
| Clerk | Free (10,000 MAU) | $0 |
| OpenAI | Pay-as-you-go | ~$10-50 |
| **Total** | | **~$10-50/month** |

**Note:** OpenAI costs depend on insight generation usage. With 24-hour caching, 100 insights/day = ~$2.40/month.

---

## Troubleshooting

### Build Fails

- Check Vercel build logs for errors
- Verify environment variables are set correctly
- Ensure `DATABASE_URL` uses `.pooler.supabase.com` (not direct connection)

### Database Connection Issues

- Verify Supabase connection pooling is enabled
- Check `DATABASE_URL` format: `postgresql://postgres.REF:PASSWORD@REF.pooler.supabase.com:5432/postgres`
- Confirm Supabase project is not paused (free tier pauses after 7 days inactivity)

### Authentication Not Working

- Verify Clerk production keys are correct
- Check Clerk Dashboard > Domains - add Vercel domain if needed
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` match

### AI Insights Failing

- Check OpenAI API key is valid
- Verify you have credits in OpenAI account
- Review Vercel function logs for error messages

---

## Next Steps After Deployment

1. **Test with real users** - Invite beta testers to try the app
2. **Monitor for 24 hours** - Check logs for errors
3. **Gather feedback** - Use the in-app feedback button
4. **Optimize based on data** - Use Vercel Analytics to identify slow pages
5. **Plan feature releases** - Use the deployment workflow for future updates

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Clerk Docs:** https://clerk.com/docs
- **Next.js Docs:** https://nextjs.org/docs

**For deployment issues:** Check Vercel function logs in Dashboard > Logs

---

## File Reference

**Security & Configuration:**
- `middleware.ts` - Test route blocking, auth protection
- `next.config.ts` - Security headers (CSP, HSTS, X-Frame-Options)
- `.env.production.example` - Environment variable template

**Health & Monitoring:**
- `app/api/health/production/route.ts` - Production health check endpoint

**Database:**
- `db/manual-migrations/performance-indexes.sql` - Performance optimization indexes

**Documentation:**
- `CLAUDE.md` - Complete project documentation
- `USE_CASES.md` - User journeys and personas
- `UX_UI_SPEC.md` - UX/UI specification
