CREATE TABLE "user_music_recommendations" (
	"user_id" uuid NOT NULL,
	"poll_id" uuid NOT NULL,
	"song_title" text NOT NULL,
	"artist_name" text NOT NULL,
	"spotify_link" text NOT NULL,
	"apple_music_link" text NOT NULL,
	"thumbnail_url" text NOT NULL,
	"reasoning" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"insight_fingerprint" text NOT NULL,
	CONSTRAINT "user_music_recommendations_user_id_poll_id_pk" PRIMARY KEY("user_id","poll_id")
);
--> statement-breakpoint
ALTER TABLE "user_music_recommendations" ADD CONSTRAINT "user_music_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_music_recommendations" ADD CONSTRAINT "user_music_recommendations_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_music_recommendations_fingerprint_idx" ON "user_music_recommendations" USING btree ("insight_fingerprint");