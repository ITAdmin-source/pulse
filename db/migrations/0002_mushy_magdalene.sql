CREATE TABLE "user_demographics" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"age_group_id" integer,
	"gender_id" integer,
	"ethnicity_id" integer,
	"political_party_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_demographics" ADD CONSTRAINT "user_demographics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_demographics" ADD CONSTRAINT "user_demographics_age_group_id_age_groups_id_fk" FOREIGN KEY ("age_group_id") REFERENCES "public"."age_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_demographics" ADD CONSTRAINT "user_demographics_gender_id_genders_id_fk" FOREIGN KEY ("gender_id") REFERENCES "public"."genders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_demographics" ADD CONSTRAINT "user_demographics_ethnicity_id_ethnicities_id_fk" FOREIGN KEY ("ethnicity_id") REFERENCES "public"."ethnicities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_demographics" ADD CONSTRAINT "user_demographics_political_party_id_political_parties_id_fk" FOREIGN KEY ("political_party_id") REFERENCES "public"."political_parties"("id") ON DELETE no action ON UPDATE no action;