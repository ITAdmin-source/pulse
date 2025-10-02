ALTER TYPE "public"."poll_status" ADD VALUE 'closed';--> statement-breakpoint
CREATE TABLE "poll_results_summaries" (
	"poll_id" uuid PRIMARY KEY NOT NULL,
	"summary_text" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"participant_count" integer NOT NULL,
	"vote_count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "poll_results_summaries" ADD CONSTRAINT "poll_results_summaries_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;