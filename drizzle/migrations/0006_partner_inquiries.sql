CREATE TABLE IF NOT EXISTS "partner_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_reference" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"organization" text NOT NULL,
	"role" text NOT NULL,
	"category" text NOT NULL,
	"stage_or_scale" text,
	"message" text NOT NULL,
	"notification_status" text DEFAULT 'pending' NOT NULL,
	"notification_error" text,
	"notification_dispatch_id" text,
	"notification_sent_at" timestamp with time zone,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_inquiries_inquiry_reference_unique" UNIQUE("inquiry_reference"),
	CONSTRAINT "partner_inquiries_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_inquiries_email_idx" ON "partner_inquiries" USING btree ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_inquiries_org_idx" ON "partner_inquiries" USING btree ("organization");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_inquiries_created_at_idx" ON "partner_inquiries" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_inquiries_status_idx" ON "partner_inquiries" USING btree ("notification_status");
--> statement-breakpoint
ALTER TABLE "public"."partner_inquiries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."partner_inquiries" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."partner_inquiries" FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "public"."partner_inquiries" FROM "anon";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "public"."partner_inquiries" FROM "authenticated";
  END IF;
END $$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO "speakql_runtime";
--> statement-breakpoint
GRANT INSERT, SELECT, UPDATE ON TABLE "public"."partner_inquiries" TO "speakql_runtime";
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'speakql_app') THEN
    GRANT INSERT, SELECT, UPDATE ON TABLE "public"."partner_inquiries" TO "speakql_app";
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'partner_inquiries_runtime_insert' AND tablename = 'partner_inquiries') THEN
    CREATE POLICY "partner_inquiries_runtime_insert" ON "public"."partner_inquiries"
      AS PERMISSIVE FOR INSERT TO "speakql_runtime" WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'partner_inquiries_runtime_select' AND tablename = 'partner_inquiries') THEN
    CREATE POLICY "partner_inquiries_runtime_select" ON "public"."partner_inquiries"
      AS PERMISSIVE FOR SELECT TO "speakql_runtime" USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'partner_inquiries_runtime_update' AND tablename = 'partner_inquiries') THEN
    CREATE POLICY "partner_inquiries_runtime_update" ON "public"."partner_inquiries"
      AS PERMISSIVE FOR UPDATE TO "speakql_runtime" USING (true) WITH CHECK (true);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'speakql_app') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'partner_inquiries_app_insert' AND tablename = 'partner_inquiries') THEN
      CREATE POLICY "partner_inquiries_app_insert" ON "public"."partner_inquiries"
        AS PERMISSIVE FOR INSERT TO "speakql_app" WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'partner_inquiries_app_select' AND tablename = 'partner_inquiries') THEN
      CREATE POLICY "partner_inquiries_app_select" ON "public"."partner_inquiries"
        AS PERMISSIVE FOR SELECT TO "speakql_app" USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'partner_inquiries_app_update' AND tablename = 'partner_inquiries') THEN
      CREATE POLICY "partner_inquiries_app_update" ON "public"."partner_inquiries"
        AS PERMISSIVE FOR UPDATE TO "speakql_app" USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;
