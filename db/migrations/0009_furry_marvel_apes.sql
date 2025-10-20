CREATE TABLE "poll_clustering_metadata" (
	"poll_id" uuid PRIMARY KEY NOT NULL,
	"pca_components" jsonb NOT NULL,
	"variance_explained" jsonb NOT NULL,
	"mean_vector" jsonb NOT NULL,
	"cluster_centroids" jsonb NOT NULL,
	"num_fine_clusters" smallint NOT NULL,
	"coarse_groups" jsonb NOT NULL,
	"silhouette_score" real NOT NULL,
	"total_variance_explained" real NOT NULL,
	"total_users" smallint NOT NULL,
	"total_statements" smallint NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" smallint DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statement_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"statement_id" uuid NOT NULL,
	"classification_type" text NOT NULL,
	"group_agreements" jsonb NOT NULL,
	"average_agreement" real NOT NULL,
	"standard_deviation" real NOT NULL,
	"bridge_score" real,
	"connects_groups" jsonb,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_clustering_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"pc1" real NOT NULL,
	"pc2" real NOT NULL,
	"fine_cluster_id" smallint NOT NULL,
	"coarse_group_id" smallint NOT NULL,
	"total_votes" smallint NOT NULL,
	"agree_count" smallint NOT NULL,
	"disagree_count" smallint NOT NULL,
	"pass_count" smallint NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "poll_clustering_metadata" ADD CONSTRAINT "poll_clustering_metadata_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_classifications" ADD CONSTRAINT "statement_classifications_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_clustering_positions" ADD CONSTRAINT "user_clustering_positions_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_clustering_positions" ADD CONSTRAINT "user_clustering_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) FOR CLUSTERING TABLES
-- =============================================================================

-- POLL_CLUSTERING_METADATA: Contains PCA components and cluster centroids
-- Risk: Reveals opinion group structure, potentially enables pattern matching
ALTER TABLE "poll_clustering_metadata" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_clustering_metadata_block_direct_access"
ON "poll_clustering_metadata"
FOR ALL
USING (false);

-- USER_CLUSTERING_POSITIONS: User positions in 2D opinion space
-- Risk: HIGH - Reveals user voting patterns through coordinates, enables deanonymization
ALTER TABLE "user_clustering_positions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_clustering_positions_block_direct_access"
ON "user_clustering_positions"
FOR ALL
USING (false);

-- STATEMENT_CLASSIFICATIONS: Consensus/divisive/bridge classifications
-- Risk: Reveals polarization patterns, could be used to identify contentious topics
ALTER TABLE "statement_classifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "statement_classifications_block_direct_access"
ON "statement_classifications"
FOR ALL
USING (false);