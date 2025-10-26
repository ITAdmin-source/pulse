CREATE INDEX "user_demographics_gender_id_idx" ON "user_demographics" USING btree ("gender_id");--> statement-breakpoint
CREATE INDEX "user_demographics_age_group_id_idx" ON "user_demographics" USING btree ("age_group_id");--> statement-breakpoint
CREATE INDEX "user_demographics_ethnicity_id_idx" ON "user_demographics" USING btree ("ethnicity_id");--> statement-breakpoint
CREATE INDEX "user_demographics_political_party_id_idx" ON "user_demographics" USING btree ("political_party_id");