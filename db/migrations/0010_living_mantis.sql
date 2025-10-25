CREATE TABLE "statement_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"statement_id" uuid NOT NULL,
	"predictiveness" real NOT NULL,
	"consensus_potential" real NOT NULL,
	"recency_boost" real NOT NULL,
	"pass_rate_penalty" real NOT NULL,
	"vote_count_boost" real,
	"combined_weight" real NOT NULL,
	"mode" text NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"agree_count" integer DEFAULT 0 NOT NULL,
	"disagree_count" integer DEFAULT 0 NOT NULL,
	"pass_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "statement_weights_unique_idx" UNIQUE("statement_id","poll_id")
);
--> statement-breakpoint
ALTER TABLE "statement_weights" ADD CONSTRAINT "statement_weights_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_weights" ADD CONSTRAINT "statement_weights_statement_id_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."statements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "statement_weights_poll_id_idx" ON "statement_weights" USING btree ("poll_id");