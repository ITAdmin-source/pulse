ALTER TABLE "user_poll_insights" ADD COLUMN "artifact_rarity" text DEFAULT 'common';--> statement-breakpoint
ALTER TABLE "user_poll_insights" ADD COLUMN "is_new_artifact" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_poll_insights" ADD COLUMN "first_seen_at" timestamp with time zone;