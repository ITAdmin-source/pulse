-- Performance Indexes for Production Deployment
-- Run this in Supabase SQL Editor BEFORE deploying to production
-- These indexes optimize high-traffic queries for voting and poll operations

-- Votes table indexes (high traffic during voting)
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_statement_id ON votes(statement_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_statement ON votes(user_id, statement_id);

-- Statements table indexes (filtering by poll and approval status)
CREATE INDEX IF NOT EXISTS idx_statements_poll_id ON statements(poll_id);
CREATE INDEX IF NOT EXISTS idx_statements_approved ON statements(approved) WHERE approved IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_statements_poll_approved ON statements(poll_id, approved);

-- Polls table indexes (lookups by slug and status)
CREATE INDEX IF NOT EXISTS idx_polls_slug ON polls(slug);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);

-- Users table indexes (lookups by clerk_user_id and session_id)
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id) WHERE clerk_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id) WHERE session_id IS NOT NULL;

-- User poll insights table index (composite primary key optimization)
CREATE INDEX IF NOT EXISTS idx_user_poll_insights ON user_poll_insights(user_id, poll_id);

-- Verify indexes were created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY
    tablename, indexname;
