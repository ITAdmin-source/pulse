-- Migration: Update users table for JWT-only architecture
-- Remove upgradedAt and metadata columns, add lastSyncedAt and cachedMetadata

-- Add new columns
ALTER TABLE "users" ADD COLUMN "last_synced_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN "cached_metadata" jsonb;

-- Drop old columns that are no longer needed for JWT-only approach
ALTER TABLE "users" DROP COLUMN IF EXISTS "upgraded_at";
ALTER TABLE "users" DROP COLUMN IF EXISTS "metadata";