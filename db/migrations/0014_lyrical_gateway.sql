CREATE INDEX "clustering_queue_poll_id_idx" ON "clustering_queue" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "clustering_queue_status_idx" ON "clustering_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "clustering_queue_created_at_idx" ON "clustering_queue" USING btree ("created_at");