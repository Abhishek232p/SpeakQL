CREATE TABLE "competencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competencies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "learning_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "practice_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_response" text NOT NULL,
	"feedback" text NOT NULL,
	"score" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_evaluations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "practice_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competency_id" uuid NOT NULL,
	"scenario_prompt" text NOT NULL,
	"expected_structure" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_exercises" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_goal_id_learning_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."learning_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_evaluations" ADD CONSTRAINT "practice_evaluations_exercise_id_practice_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."practice_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_evaluations" ADD CONSTRAINT "practice_evaluations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_exercises" ADD CONSTRAINT "practice_exercises_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competencies_goal_id_idx" ON "competencies" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "learning_goals_user_id_idx" ON "learning_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "practice_evaluations_exercise_id_idx" ON "practice_evaluations" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "practice_evaluations_user_id_idx" ON "practice_evaluations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "practice_exercises_competency_id_idx" ON "practice_exercises" USING btree ("competency_id");--> statement-breakpoint
CREATE POLICY "competencies_select_own" ON "competencies" AS PERMISSIVE FOR SELECT TO "speakql_runtime" USING (exists (select 1 from "public"."learning_goals" g join "public"."users" as identity_user on g.user_id = identity_user.id where g.id = "competencies"."goal_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "competencies_insert_own" ON "competencies" AS PERMISSIVE FOR INSERT TO "speakql_runtime" WITH CHECK (exists (select 1 from "public"."learning_goals" g join "public"."users" as identity_user on g.user_id = identity_user.id where g.id = "competencies"."goal_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "competencies_update_own" ON "competencies" AS PERMISSIVE FOR UPDATE TO "speakql_runtime" USING (exists (select 1 from "public"."learning_goals" g join "public"."users" as identity_user on g.user_id = identity_user.id where g.id = "competencies"."goal_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), ''))) WITH CHECK (exists (select 1 from "public"."learning_goals" g join "public"."users" as identity_user on g.user_id = identity_user.id where g.id = "competencies"."goal_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "goals_select_own" ON "learning_goals" AS PERMISSIVE FOR SELECT TO "speakql_runtime" USING (exists (select 1 from "public"."users" as identity_user where identity_user.id = "learning_goals"."user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "goals_insert_own" ON "learning_goals" AS PERMISSIVE FOR INSERT TO "speakql_runtime" WITH CHECK (exists (select 1 from "public"."users" as identity_user where identity_user.id = "learning_goals"."user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "goals_update_own" ON "learning_goals" AS PERMISSIVE FOR UPDATE TO "speakql_runtime" USING (exists (select 1 from "public"."users" as identity_user where identity_user.id = "learning_goals"."user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), ''))) WITH CHECK (exists (select 1 from "public"."users" as identity_user where identity_user.id = "learning_goals"."user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "evaluations_select_own" ON "practice_evaluations" AS PERMISSIVE FOR SELECT TO "speakql_runtime" USING (exists (select 1 from "public"."users" as identity_user where identity_user.id = "practice_evaluations"."user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "evaluations_insert_own" ON "practice_evaluations" AS PERMISSIVE FOR INSERT TO "speakql_runtime" WITH CHECK (exists (select 1 from "public"."users" as identity_user where identity_user.id = "practice_evaluations"."user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "exercises_select_own" ON "practice_exercises" AS PERMISSIVE FOR SELECT TO "speakql_runtime" USING (exists (select 1 from "public"."competencies" c join "public"."learning_goals" g on c.goal_id = g.id join "public"."users" as identity_user on g.user_id = identity_user.id where c.id = "practice_exercises"."competency_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "exercises_insert_own" ON "practice_exercises" AS PERMISSIVE FOR INSERT TO "speakql_runtime" WITH CHECK (exists (select 1 from "public"."competencies" c join "public"."learning_goals" g on c.goal_id = g.id join "public"."users" as identity_user on g.user_id = identity_user.id where c.id = "practice_exercises"."competency_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "exercises_update_own" ON "practice_exercises" AS PERMISSIVE FOR UPDATE TO "speakql_runtime" USING (exists (select 1 from "public"."competencies" c join "public"."learning_goals" g on c.goal_id = g.id join "public"."users" as identity_user on g.user_id = identity_user.id where c.id = "practice_exercises"."competency_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), ''))) WITH CHECK (exists (select 1 from "public"."competencies" c join "public"."learning_goals" g on c.goal_id = g.id join "public"."users" as identity_user on g.user_id = identity_user.id where c.id = "practice_exercises"."competency_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."learning_goals", "public"."competencies", "public"."practice_exercises", "public"."practice_evaluations" FROM PUBLIC;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."learning_goals", "public"."competencies", "public"."practice_exercises" TO "speakql_runtime";
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "public"."practice_evaluations" TO "speakql_runtime";

