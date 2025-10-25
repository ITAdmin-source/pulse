-- Migration: Enable Row Level Security (RLS) on all tables
-- Purpose: Defense-in-depth security to protect against direct database access
-- Architecture: Server Actions use service role (bypasses RLS), direct connections blocked

-- =============================================================================
-- CRITICAL TABLES (HIGH SENSITIVITY - PII & Personal Data)
-- =============================================================================

-- 1. USER_DEMOGRAPHICS: Contains sensitive personal information (age, gender, ethnicity, politics)
-- Risk: GDPR Article 9 special category data, PII exposure
ALTER TABLE "user_demographics" ENABLE ROW LEVEL SECURITY;

-- Default deny all access (service role bypasses this automatically)
CREATE POLICY "user_demographics_block_direct_access"
ON "user_demographics"
FOR ALL
USING (false);

-- 2. VOTES: User voting behavior reveals personal opinions
-- Risk: Vote deanonymization, privacy breach, undermines voting secrecy
ALTER TABLE "votes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "votes_block_direct_access"
ON "votes"
FOR ALL
USING (false);

-- 3. USER_POLL_INSIGHTS: AI-generated personal profiles based on voting patterns
-- Risk: Psychological profiling, reveals personal characteristics
ALTER TABLE "user_poll_insights" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_poll_insights_block_direct_access"
ON "user_poll_insights"
FOR ALL
USING (false);

-- =============================================================================
-- MODERATE SENSITIVITY TABLES (User Identity & Permissions)
-- =============================================================================

-- 4. USERS: Core user records with Clerk IDs and metadata (may contain emails)
-- Risk: User enumeration, email harvesting, account correlation
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_block_direct_access"
ON "users"
FOR ALL
USING (false);

-- 5. USER_PROFILES: Extended user profiles (names, pictures, social links)
-- Risk: PII exposure, identity theft, privacy violation
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_block_direct_access"
ON "user_profiles"
FOR ALL
USING (false);

-- 6. USER_ROLES: Permission assignments and access control
-- Risk: Privilege enumeration, unauthorized access, permission bypass
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_block_direct_access"
ON "user_roles"
FOR ALL
USING (false);

-- 7. USER_FEEDBACK: User feedback submissions (may contain sensitive comments)
-- Risk: Information disclosure, privacy concerns
ALTER TABLE "user_feedback" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_feedback_block_direct_access"
ON "user_feedback"
FOR ALL
USING (false);

-- =============================================================================
-- MODERATE SENSITIVITY TABLES (Content & Configuration)
-- =============================================================================

-- 8. POLLS: Poll definitions (draft polls should be private)
-- Risk: Unreleased poll leakage, competitive intelligence
ALTER TABLE "polls" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "polls_block_direct_access"
ON "polls"
FOR ALL
USING (false);

-- 9. STATEMENTS: User-submitted positions (unapproved statements should be private)
-- Risk: Moderation bypass, inappropriate content exposure
ALTER TABLE "statements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "statements_block_direct_access"
ON "statements"
FOR ALL
USING (false);

-- 10. POLL_RESULTS_SUMMARIES: AI-generated poll summaries (contains aggregate data)
-- Risk: Minimal (aggregate data), but should follow same pattern
ALTER TABLE "poll_results_summaries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_results_summaries_block_direct_access"
ON "poll_results_summaries"
FOR ALL
USING (false);

-- =============================================================================
-- LOW SENSITIVITY TABLES (Lookup/Reference Data)
-- =============================================================================

-- 11. AGE_GROUPS: Lookup table for age demographics (static reference data)
-- Risk: Minimal (public data), but enabled for consistency
ALTER TABLE "age_groups" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "age_groups_block_direct_access"
ON "age_groups"
FOR ALL
USING (false);

-- 12. GENDERS: Lookup table for gender demographics (static reference data)
-- Risk: Minimal (public data), but enabled for consistency
ALTER TABLE "genders" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "genders_block_direct_access"
ON "genders"
FOR ALL
USING (false);

-- 13. ETHNICITIES: Lookup table for ethnicity demographics (static reference data)
-- Risk: Minimal (public data), but enabled for consistency
ALTER TABLE "ethnicities" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ethnicities_block_direct_access"
ON "ethnicities"
FOR ALL
USING (false);

-- 14. POLITICAL_PARTIES: Lookup table for political affiliation (static reference data)
-- Risk: Minimal (public data), but enabled for consistency
ALTER TABLE "political_parties" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "political_parties_block_direct_access"
ON "political_parties"
FOR ALL
USING (false);

-- =============================================================================
-- SECURITY NOTES
-- =============================================================================

-- ✅ APPLICATION LAYER (Server Actions) uses service role credentials
--    Service role BYPASSES RLS policies automatically - no code changes needed
--
-- ❌ DIRECT DATABASE ACCESS (stolen DATABASE_URL) hits RLS policies
--    All policies above deny access (USING false) - attackers get zero data
--
-- 🔒 DEFENSE-IN-DEPTH ACHIEVED
--    Layer 1: Authentication (Clerk JWT)
--    Layer 2: Authorization (Server Actions)
--    Layer 3: Input Validation (Zod)
--    Layer 4: SQL Injection Prevention (Drizzle ORM)
--    Layer 5: Database Access Control (RLS) ✅ NOW ENABLED
--
-- 📊 RISK REDUCTION
--    Without RLS: DATABASE_URL leak = FULL DATA BREACH
--    With RLS: DATABASE_URL leak = ZERO DATA EXPOSED (blocked by policies)
--
-- 🧪 TESTING VERIFICATION
--    1. Verify Server Actions still work (should bypass RLS)
--    2. Test direct psql connection (should be blocked)
--    3. Check application functionality (should be unaffected)

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =============================================================================

-- To rollback this migration (disable RLS on all tables):
--
-- ALTER TABLE "user_demographics" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "votes" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "user_poll_insights" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "user_profiles" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "user_roles" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "user_feedback" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "polls" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "statements" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "poll_results_summaries" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "age_groups" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "genders" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "ethnicities" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "political_parties" DISABLE ROW LEVEL SECURITY;
--
-- Then drop all policies:
--
-- DROP POLICY IF EXISTS "user_demographics_block_direct_access" ON "user_demographics";
-- DROP POLICY IF EXISTS "votes_block_direct_access" ON "votes";
-- DROP POLICY IF EXISTS "user_poll_insights_block_direct_access" ON "user_poll_insights";
-- DROP POLICY IF EXISTS "users_block_direct_access" ON "users";
-- DROP POLICY IF EXISTS "user_profiles_block_direct_access" ON "user_profiles";
-- DROP POLICY IF EXISTS "user_roles_block_direct_access" ON "user_roles";
-- DROP POLICY IF EXISTS "user_feedback_block_direct_access" ON "user_feedback";
-- DROP POLICY IF EXISTS "polls_block_direct_access" ON "polls";
-- DROP POLICY IF EXISTS "statements_block_direct_access" ON "statements";
-- DROP POLICY IF EXISTS "poll_results_summaries_block_direct_access" ON "poll_results_summaries";
-- DROP POLICY IF EXISTS "age_groups_block_direct_access" ON "age_groups";
-- DROP POLICY IF EXISTS "genders_block_direct_access" ON "genders";
-- DROP POLICY IF EXISTS "ethnicities_block_direct_access" ON "ethnicities";
-- DROP POLICY IF EXISTS "political_parties_block_direct_access" ON "political_parties";
