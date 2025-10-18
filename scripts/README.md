# Database Security Scripts

This directory contains scripts for managing Row Level Security (RLS) on the Pulse database.

## Scripts

### `check-rls-status.ts`

**Purpose:** Check the RLS status on all database tables.

**Usage:**
```bash
npx tsx scripts/check-rls-status.ts
```

**Output:**
- Table-by-table RLS status report
- Summary of enabled/disabled tables
- List of RLS policies found

**Example Output:**
```
🔍 Checking Row Level Security (RLS) status...

📊 RLS Status Report:

┌─────────────────────────────┬─────────────┐
│ Table Name                  │ RLS Enabled │
├─────────────────────────────┼─────────────┤
│ users                       │ ✅ YES       │
│ votes                       │ ✅ YES       │
│ user_demographics           │ ✅ YES       │
└─────────────────────────────┴─────────────┘

📈 Summary:
   ✅ 14 tables with RLS enabled
   ❌ 0 tables without RLS
   📊 Total: 14 tables

🎉 All tables have Row Level Security enabled!
```

### `apply-rls-migration.ts`

**Purpose:** Apply RLS policies from the migration file to the database.

**Usage:**
```bash
npx tsx scripts/apply-rls-migration.ts
```

**What it does:**
1. Reads `db/migrations/0009_enable_row_level_security.sql`
2. Enables RLS on all tables
3. Creates "deny by default" policies
4. Reports success/skipped statements

**Output:**
```
🔒 Applying Row Level Security (RLS) migration...

📄 Found 28 SQL statements to execute

✅ [1/28] ENABLE RLS on "user_demographics"
✅ [2/28] CREATE POLICY on "user_demographics"
...

================================================================================
✅ RLS Migration completed successfully!
   - 28 statements executed
   - 0 statements skipped (already applied)
   - All 14 tables now have Row Level Security enabled
================================================================================
```

**Note:** This script is idempotent - it's safe to run multiple times.

## Row Level Security (RLS) Overview

### What is RLS?

Row Level Security is a PostgreSQL feature that restricts which rows can be returned by queries or modified by data manipulation statements based on policies.

### Why RLS is Important

**Defense-in-Depth Security:**
- **Without RLS:** If `DATABASE_URL` leaks → Full data breach
- **With RLS:** If `DATABASE_URL` leaks → Zero data exposed (blocked by policies)

**Compliance:**
- Required by GDPR, SOC 2, ISO 27001 for sensitive data
- Industry best practice for multi-tenant databases
- Provides audit trail at database level

### How RLS Works in Pulse

**Architecture:**
1. **Server Actions** use service role credentials
   - Service role automatically bypasses RLS policies
   - No application code changes needed
   - All queries work normally

2. **Direct database connections** hit RLS policies
   - Blocked by "deny by default" policies
   - Attackers get zero data even with valid credentials
   - Database logs show unauthorized access attempts

**Policy Pattern:**
```sql
-- Enable RLS on table
ALTER TABLE "table_name" ENABLE ROW LEVEL SECURITY;

-- Create restrictive policy (deny all direct access)
CREATE POLICY "table_name_block_direct_access"
ON "table_name"
FOR ALL
USING (false);  -- Always returns false = no access
```

### Tables Protected (14 total)

**High Sensitivity (PII & Personal Data):**
- `user_demographics` - Age, gender, ethnicity, political affiliation
- `votes` - User voting behavior (reveals opinions)
- `user_poll_insights` - AI-generated personal profiles

**Medium Sensitivity (User Identity & Permissions):**
- `users` - User accounts with Clerk IDs
- `user_profiles` - Extended profiles (names, pictures)
- `user_roles` - Permission assignments
- `user_feedback` - User feedback submissions
- `polls` - Poll definitions (draft polls should be private)
- `statements` - User-submitted positions

**Low Sensitivity (Aggregate & Reference Data):**
- `poll_results_summaries` - AI-generated summaries
- `age_groups`, `genders`, `ethnicities`, `political_parties` - Lookup tables

## Testing RLS

### Verify Server Actions Still Work

1. Start the development server:
```bash
npm run dev
```

2. Test key functionality:
   - User sign-up and login
   - Creating a poll
   - Voting on statements
   - Viewing results

All features should work normally - RLS is transparent to the application.

### Verify Direct Connections are Blocked

⚠️ **WARNING: Only test this in development, not production!**

1. Get your `DATABASE_URL` from `.env.local`

2. Try to connect directly with `psql`:
```bash
psql "your_database_url_here"
```

3. Attempt to query data:
```sql
SELECT * FROM user_demographics;
```

4. **Expected result:** Query returns 0 rows (blocked by RLS)

5. Check policy status:
```sql
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
```

## Troubleshooting

### Application stopped working after enabling RLS

**Cause:** Likely not using service role credentials in `DATABASE_URL`

**Solution:**
1. Verify your `DATABASE_URL` uses the pooler connection with admin credentials
2. Check that `db/db.ts` creates the connection correctly
3. Review error logs for specific issues

### RLS policies not being enforced

**Cause:** Table may not have RLS enabled

**Solution:**
```bash
# Check RLS status
npx tsx scripts/check-rls-status.ts

# Re-apply RLS if needed
npx tsx scripts/apply-rls-migration.ts
```

### Migration script fails

**Cause:** SQL syntax errors or policies already exist

**Solution:**
1. Review error message carefully
2. Check `db/migrations/0009_enable_row_level_security.sql` for syntax
3. Script handles "already exists" errors gracefully (skips and continues)

## Adding RLS to New Tables

When creating new tables, **ALWAYS enable RLS immediately**. See `NEW_TABLE_INSTRUCTIONS.md` Step 7 for details.

**Quick reference:**
```sql
-- In your migration file
ALTER TABLE "new_table_name" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "new_table_name_block_direct_access"
ON "new_table_name"
FOR ALL
USING (false);
```

Then apply with:
```bash
npx tsx scripts/apply-rls-migration.ts
```

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Rotate DATABASE_URL** if accidentally exposed
3. **Monitor database logs** for unauthorized access attempts
4. **Test RLS policies** after schema changes
5. **Document security changes** in CLAUDE.md

## Additional Resources

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Security Audit Report](.claude/misc/MIGRATION_PLAN.md)
