-- Quick SQL script to check poll configuration and statement counts
-- Run this in Supabase SQL editor to understand your poll setup

-- Replace 'your-poll-slug' with your actual poll slug
WITH poll_info AS (
  SELECT
    id,
    slug,
    question,
    statement_order_mode,
    random_seed,
    status
  FROM polls
  WHERE slug = 'your-poll-slug'  -- REPLACE THIS
),
statement_counts AS (
  SELECT
    p.id as poll_id,
    COUNT(*) as total_statements,
    COUNT(*) FILTER (WHERE s.approved = true) as approved_statements,
    COUNT(*) FILTER (WHERE s.approved IS NULL) as pending_statements,
    COUNT(*) FILTER (WHERE s.approved = false) as rejected_statements
  FROM poll_info p
  LEFT JOIN statements s ON s.poll_id = p.id
  GROUP BY p.id
)
SELECT
  p.slug,
  p.question,
  p.statement_order_mode as "Order Mode",
  p.random_seed as "Random Seed",
  p.status as "Poll Status",
  sc.total_statements as "Total Statements",
  sc.approved_statements as "Approved",
  sc.pending_statements as "Pending",
  sc.rejected_statements as "Rejected"
FROM poll_info p
LEFT JOIN statement_counts sc ON sc.poll_id = p.id;

-- Check user votes for a specific user
-- Replace 'user-id-here' with actual user ID
SELECT
  COUNT(*) as total_votes_in_poll
FROM votes v
INNER JOIN statements s ON v.statement_id = s.id
WHERE s.poll_id = (SELECT id FROM poll_info)
  AND v.user_id = 'user-id-here';  -- REPLACE THIS
