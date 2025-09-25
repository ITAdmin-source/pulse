CREATE TABLE "age_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "age_groups_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "genders" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "genders_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "ethnicities" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "ethnicities_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "political_parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "political_parties_label_unique" UNIQUE("label")
);
