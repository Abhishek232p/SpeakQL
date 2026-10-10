-- Local artifact only. Review the actual target's owners, grants, policies and
-- event triggers before applying. Deliberately do not adopt an existing role,
-- alter rls_auto_enable, or disable/replace any event trigger.
SET LOCAL search_path = pg_catalog, public, pg_temp;
--> statement-breakpoint
CREATE ROLE "speakql_runtime" NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
--> statement-breakpoint
-- Unknown permissive policies could widen these policies by OR-composition.
-- Stop for review rather than deleting or silently trusting remote policies.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy
    WHERE polrelid IN ('public.users'::regclass, 'public.user_profiles'::regclass, 'public.audit_events'::regclass)
  ) THEN
    RAISE EXCEPTION 'Existing application RLS policies require review before runtime-security migration';
  END IF;
END $$;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."users", "public"."user_profiles", "public"."audit_events" FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ("id", "auth_issuer", "auth_subject", "created_at", "updated_at") ON TABLE "public"."users" FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ("user_id", "display_name", "locale", "timezone", "created_at", "updated_at") ON TABLE "public"."user_profiles" FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ("id", "actor_user_id", "action", "resource_type", "resource_id", "metadata", "occurred_at") ON TABLE "public"."audit_events" FROM PUBLIC;
--> statement-breakpoint
-- These tables are server-only, including on Supabase installations that grant
-- API roles privileges through default ACLs. Do not change schema-wide defaults.
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.users, public.user_profiles, public.audit_events FROM %I', api_role);
      EXECUTE format('REVOKE ALL PRIVILEGES (id, auth_issuer, auth_subject, created_at, updated_at) ON TABLE public.users FROM %I', api_role);
      EXECUTE format('REVOKE ALL PRIVILEGES (user_id, display_name, locale, timezone, created_at, updated_at) ON TABLE public.user_profiles FROM %I', api_role);
      EXECUTE format('REVOKE ALL PRIVILEGES (id, actor_user_id, action, resource_type, resource_id, metadata, occurred_at) ON TABLE public.audit_events FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO "speakql_runtime";
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "public"."users" TO "speakql_runtime";
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "public"."user_profiles" TO "speakql_runtime";
--> statement-breakpoint
GRANT UPDATE ("display_name", "locale", "timezone", "updated_at") ON TABLE "public"."user_profiles" TO "speakql_runtime";
--> statement-breakpoint
GRANT INSERT ON TABLE "public"."audit_events" TO "speakql_runtime";
--> statement-breakpoint
ALTER TABLE "public"."users" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."user_profiles" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."audit_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "audit_insert_own_profile" ON "audit_events" AS PERMISSIVE FOR INSERT TO "speakql_runtime" WITH CHECK (exists (select 1 from "public"."users" as identity_user where identity_user.id = "audit_events"."actor_user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')) and "audit_events"."resource_type" = 'user_profile' and "audit_events"."resource_id" = "audit_events"."actor_user_id"::text and "audit_events"."action" in ('profile.created', 'profile.updated'));--> statement-breakpoint
CREATE POLICY "profiles_select_own" ON "user_profiles" AS PERMISSIVE FOR SELECT TO "speakql_runtime" USING (exists (select 1 from "public"."users" as identity_user where identity_user.id = "user_profiles"."user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "profiles_insert_own" ON "user_profiles" AS PERMISSIVE FOR INSERT TO "speakql_runtime" WITH CHECK (exists (select 1 from "public"."users" as identity_user where identity_user.id = "user_profiles"."user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "user_profiles" AS PERMISSIVE FOR UPDATE TO "speakql_runtime" USING (exists (select 1 from "public"."users" as identity_user where identity_user.id = "user_profiles"."user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), ''))) WITH CHECK (exists (select 1 from "public"."users" as identity_user where identity_user.id = "user_profiles"."user_id" and identity_user.auth_issuer = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and identity_user.auth_subject = nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')));--> statement-breakpoint
CREATE POLICY "users_select_own" ON "users" AS PERMISSIVE FOR SELECT TO "speakql_runtime" USING ("users"."auth_issuer" = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and "users"."auth_subject" = nullif(pg_catalog.current_setting('speakql.auth_subject', true), ''));--> statement-breakpoint
CREATE POLICY "users_insert_own" ON "users" AS PERMISSIVE FOR INSERT TO "speakql_runtime" WITH CHECK ("users"."auth_issuer" = nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '') and "users"."auth_subject" = nullif(pg_catalog.current_setting('speakql.auth_subject', true), ''));
