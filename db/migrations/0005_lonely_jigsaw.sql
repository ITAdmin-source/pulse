CREATE TYPE "public"."poll_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"allow_user_statements" boolean DEFAULT false NOT NULL,
	"auto_approve_statements" boolean DEFAULT false NOT NULL,
	"slug" text NOT NULL,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"status" "poll_status" DEFAULT 'draft' NOT NULL,
	"voting_goal" integer,
	"support_button_label" varchar(10),
	"oppose_button_label" varchar(10),
	"unsure_button_label" varchar(10),
	"min_statements_voted_to_end" integer DEFAULT 5 NOT NULL,
	CONSTRAINT "polls_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;