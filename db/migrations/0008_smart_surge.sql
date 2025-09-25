CREATE TABLE "user_poll_insights" (
	"user_id" uuid NOT NULL,
	"poll_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_poll_insights_user_id_poll_id_pk" PRIMARY KEY("user_id","poll_id")
);
--> statement-breakpoint
ALTER TABLE "user_poll_insights" ADD CONSTRAINT "user_poll_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_poll_insights" ADD CONSTRAINT "user_poll_insights_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;