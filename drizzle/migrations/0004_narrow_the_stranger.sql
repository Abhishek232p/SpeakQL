ALTER POLICY "evaluations_select_own" ON "practice_evaluations" TO speakql_runtime USING (exists (
    select 1
    from "public"."practice_exercises" exercise
    join "public"."competencies" competency on competency.id = exercise.competency_id
    join "public"."learning_goals" goal on goal.id = competency.goal_id
    join "public"."users" identity_user on identity_user.id = goal.user_id
    where exercise.id = "practice_evaluations"."exercise_id"
      and identity_user.id = "practice_evaluations"."user_id"
      and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '')
      and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')
  ));--> statement-breakpoint
ALTER POLICY "evaluations_insert_own" ON "practice_evaluations" TO speakql_runtime WITH CHECK (exists (
    select 1
    from "public"."practice_exercises" exercise
    join "public"."competencies" competency on competency.id = exercise.competency_id
    join "public"."learning_goals" goal on goal.id = competency.goal_id
    join "public"."users" identity_user on identity_user.id = goal.user_id
    where exercise.id = "practice_evaluations"."exercise_id"
      and identity_user.id = "practice_evaluations"."user_id"
      and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '')
      and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')
  ));