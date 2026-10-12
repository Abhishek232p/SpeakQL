-- Local artifact only. Apply only after reviewing the target and migration
-- history. The learning tables must have the same defense-in-depth RLS mode
-- as the identity/profile tables before the runtime role is accepted.
ALTER TABLE "public"."learning_goals" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."competencies" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."practice_exercises" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."practice_evaluations" FORCE ROW LEVEL SECURITY;
