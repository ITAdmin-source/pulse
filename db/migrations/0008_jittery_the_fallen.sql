CREATE INDEX "statements_poll_id_idx" ON "statements" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "statements_poll_id_approved_idx" ON "statements" USING btree ("poll_id","approved");--> statement-breakpoint
CREATE INDEX "statements_approved_idx" ON "statements" USING btree ("approved");--> statement-breakpoint
CREATE INDEX "votes_statement_id_idx" ON "votes" USING btree ("statement_id");--> statement-breakpoint
CREATE INDEX "votes_user_id_idx" ON "votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "votes_statement_value_idx" ON "votes" USING btree ("statement_id","value");