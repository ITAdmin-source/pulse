ALTER TABLE "polls" ADD COLUMN "statement_order_mode" text DEFAULT 'random' NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "random_seed" text;