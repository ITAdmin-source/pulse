import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function applyMigration() {
  console.log("Applying clustering_queue table migration...");

  try {
    // Create enum type
    console.log("Creating clustering_job_status enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE clustering_job_status AS ENUM('pending', 'processing', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create table
    console.log("Creating clustering_queue table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS clustering_queue (
        id serial PRIMARY KEY NOT NULL,
        poll_id uuid NOT NULL,
        status clustering_job_status DEFAULT 'pending' NOT NULL,
        attempt_count integer DEFAULT 0 NOT NULL,
        max_attempts integer DEFAULT 3 NOT NULL,
        error_message text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        processed_at timestamp with time zone
      );
    `);

    // Add foreign key
    console.log("Adding foreign key constraint...");
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE clustering_queue
        ADD CONSTRAINT clustering_queue_poll_id_polls_id_fk
        FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create indexes
    console.log("Creating indexes...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS clustering_queue_poll_id_idx ON clustering_queue USING btree (poll_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS clustering_queue_status_idx ON clustering_queue USING btree (status);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS clustering_queue_created_at_idx ON clustering_queue USING btree (created_at);
    `);

    console.log("✅ Migration applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }

  process.exit(0);
}

applyMigration();
