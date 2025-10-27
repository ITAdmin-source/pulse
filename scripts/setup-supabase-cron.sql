-- Supabase pg_cron Setup for Clustering Queue
-- Run this SQL in your Supabase SQL Editor (production database only)
--
-- This sets up automatic background clustering using Supabase's pg_cron extension
-- Jobs are processed every minute with zero waste (only calls API when jobs pending)

-- ============================================================================
-- Step 1: Enable Extensions
-- ============================================================================
-- These should be enabled via Supabase Dashboard → Database → Extensions
-- - pg_cron: Enable on "extensions" schema
-- - pg_net: Enable on "extensions" schema
--
-- Or run these SQL commands:
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================================
-- Step 2: Schedule the Smart Cron Job
-- ============================================================================
-- This checks for pending jobs before making HTTP call (zero waste when idle)
--
-- IMPORTANT: Replace these values before running:
--   1. YOUR-VERCEL-APP.vercel.app → Your actual Vercel production URL
--   2. YOUR_CRON_SECRET_HERE → Your actual CRON_SECRET from environment variables

SELECT cron.schedule(
  'process-clustering-queue-prod',  -- Job name (must be unique)
  '* * * * *',                      -- Every minute (cron schedule)
  $$
  DECLARE
    pending_count INTEGER;
  BEGIN
    -- Check if there are any pending jobs in the queue
    SELECT COUNT(*) INTO pending_count
    FROM public.clustering_queue
    WHERE status = 'pending';

    -- Only make HTTP call if there's work to do
    IF pending_count > 0 THEN
      PERFORM net.http_post(
        url := 'https://YOUR-VERCEL-APP.vercel.app/api/cron/clustering',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer YOUR_CRON_SECRET_HERE'
        ),
        timeout_milliseconds := 30000  -- 30 second timeout
      );
    END IF;
  END;
  $$
);

-- ============================================================================
-- Step 3: Verify Cron Job Was Created
-- ============================================================================
-- Should return 1 row with jobname 'process-clustering-queue-prod'
SELECT
  jobid,
  jobname,
  schedule,
  active
FROM cron.job;

-- ============================================================================
-- Step 4: Monitor Cron Execution
-- ============================================================================
-- Check this periodically to ensure cron is running successfully
SELECT
  jobid,
  jobname,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- ============================================================================
-- Useful Commands
-- ============================================================================

-- Manually trigger the job (for testing):
-- SELECT cron.run_job(jobid) FROM cron.job WHERE jobname = 'process-clustering-queue-prod';

-- Unschedule/delete the job:
-- SELECT cron.unschedule('process-clustering-queue-prod');

-- Check queue status:
-- SELECT status, COUNT(*) FROM clustering_queue GROUP BY status;

-- View recent jobs with errors:
-- SELECT * FROM clustering_queue WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;

-- View pending jobs:
-- SELECT * FROM clustering_queue WHERE status = 'pending' ORDER BY created_at;

-- ============================================================================
-- Notes
-- ============================================================================
--
-- Performance: This cron job is optimized for zero waste:
-- - When queue is empty: Only runs COUNT query (<1ms), no HTTP call
-- - When jobs pending: Calls Vercel API to process up to 5 jobs
--
-- Security: CRON_SECRET protects the endpoint from unauthorized access
-- - Must match the value in your Vercel environment variables
-- - Use a strong random secret (32+ characters)
--
-- Monitoring: Use cron.job_run_details to track execution
-- - status = 'succeeded' → Job ran successfully
-- - status = 'failed' → Check return_message for error details
--
-- Troubleshooting:
-- - Jobs not processing: Check URL and CRON_SECRET are correct
-- - HTTP errors: Verify Vercel endpoint is publicly accessible
-- - Timeout errors: Increase timeout_milliseconds if needed
