import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import { auditEvents, runtimeRole, userProfiles, users } from "@/src/server/db/schema";

describe("identity migration artifact", () => {
  it("defines constrained users, profiles, and audit tables", () => {
    const sql = readFileSync("drizzle/migrations/0000_identity-foundation.sql", "utf8");
    expect(sql).toContain('CREATE TABLE "users"');
    expect(sql).toContain('CREATE UNIQUE INDEX "users_auth_identity_unique"');
    expect(sql).toContain('REFERENCES "public"."users"("id") ON DELETE cascade');
    expect(sql).toContain('CREATE TABLE "audit_events"');
    expect(sql).toContain('ON DELETE set null');
  });

  it("is registered in Drizzle's migration journal", () => {
    const journal = readFileSync("drizzle/migrations/meta/_journal.json", "utf8");
    expect(journal).toContain('"tag": "0000_identity-foundation"');
  });
});

// Artifact consistency checks only: none of these assertions execute PostgreSQL.
describe("journaled runtime security artifacts (not integration verification)", () => {
  const migration = readFileSync("drizzle/migrations/0001_runtime-security.sql", "utf8");
  const statements = migration.replace(/--[^\n]*/g, "");
  const snapshot = JSON.parse(readFileSync("drizzle/migrations/meta/0001_snapshot.json", "utf8"));
  const initial = JSON.parse(readFileSync("drizzle/migrations/meta/0000_snapshot.json", "utf8"));

  it("keeps the original journal entry and links the runtime security snapshot", () => {
    const journal = JSON.parse(readFileSync("drizzle/migrations/meta/_journal.json", "utf8"));
    expect(journal.entries.length).toBeGreaterThanOrEqual(2);
    expect(journal.entries[0]).toEqual({ idx: 0, version: "7", when: 1791573646763, tag: "0000_identity-foundation", breakpoints: true });
    const runtimeEntry = journal.entries.find((entry: { tag: string }) => entry.tag === "0001_runtime-security");
    expect(runtimeEntry).toMatchObject({ idx: 1, tag: "0001_runtime-security", breakpoints: true });
    expect(runtimeEntry.when).toBeGreaterThan(journal.entries[0].when);
    expect(journal.entries.map((entry: { idx: number }) => entry.idx)).toEqual(journal.entries.map((_: unknown, index: number) => index));
    expect(snapshot.prevId).toBe(initial.id);
    expect(snapshot.id).not.toBe(initial.id);
  });

  it("keeps schema policies and RLS flags in sync with the generated snapshot and SQL", () => {
    const dialect = new PgDialect();
    for (const table of [users, userProfiles, auditEvents]) {
      const config = getTableConfig(table);
      const saved = snapshot.tables[`public.${config.name}`];
      expect(config.enableRLS).toBe(true);
      expect(saved.isRLSEnabled).toBe(true);
      expect(initial.tables[`public.${config.name}`].isRLSEnabled).toBe(false);
      expect(Object.keys(saved.policies).sort()).toEqual(config.policies.map((policy) => policy.name).sort());
      for (const policy of config.policies) {
        expect(policy.to).toBe(runtimeRole);
        const using = policy.using && dialect.sqlToQuery(policy.using).sql;
        const withCheck = policy.withCheck && dialect.sqlToQuery(policy.withCheck).sql;
        expect(saved.policies[policy.name]).toMatchObject({ name: policy.name, for: policy.for?.toUpperCase(), to: ["speakql_runtime"] });
        expect(saved.policies[policy.name].using).toBe(using);
        expect(saved.policies[policy.name].withCheck).toBe(withCheck);
        for (const expression of [using, withCheck].filter((value): value is string => value !== undefined)) {
          expect(expression).toContain("current_setting('speakql.auth_issuer', true)");
          expect(expression).toContain("current_setting('speakql.auth_subject', true)");
          expect(expression).toContain("nullif(");
          expect(migration).toContain(expression);
        }
      }
    }
    expect(statements).not.toMatch(/auth\.uid\s*\(/i);
  });

  it("creates a nonlogin, nonprivileged role and grants only the operations this repository uses", () => {
    expect(statements).toContain('CREATE ROLE "speakql_runtime" NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;');
    expect(statements).not.toMatch(/(?:ALTER|GRANT).*OWNER TO|WITH ADMIN OPTION|WITH GRANT OPTION/i);
    const grants = statements.match(/\bGRANT\s[^;]+;/g);
    expect(grants).toEqual([
      'GRANT USAGE ON SCHEMA "public" TO "speakql_runtime";',
      'GRANT SELECT, INSERT ON TABLE "public"."users" TO "speakql_runtime";',
      'GRANT SELECT, INSERT ON TABLE "public"."user_profiles" TO "speakql_runtime";',
      'GRANT UPDATE ("display_name", "locale", "timezone", "updated_at") ON TABLE "public"."user_profiles" TO "speakql_runtime";',
      'GRANT INSERT ON TABLE "public"."audit_events" TO "speakql_runtime";',
    ]);
    expect(getTableConfig(auditEvents).policies.map((policy) => policy.for)).toEqual(["insert"]);
    expect(getTableConfig(users).policies.map((policy) => policy.for).sort()).toEqual(["insert", "select"]);
    expect(getTableConfig(userProfiles).policies.map((policy) => policy.for).sort()).toEqual(["insert", "select", "update"]);
  });

  it("forces RLS, revokes public/API table and column grants, and rejects unknown existing policies", () => {
    for (const name of ["users", "user_profiles", "audit_events"]) {
      expect(statements).toContain(`ALTER TABLE "public"."${name}" FORCE ROW LEVEL SECURITY`);
      expect(statements).toContain(`ALTER TABLE "${name}" ENABLE ROW LEVEL SECURITY`);
      expect(statements).toMatch(new RegExp(`REVOKE ALL PRIVILEGES \\([^;]+ON TABLE "public"\\."${name}" FROM PUBLIC`));
    }
    expect(statements).toContain("ARRAY['anon', 'authenticated', 'service_role']");
    expect(statements).toContain("pg_catalog.pg_policy");
    expect(statements).toContain("RAISE EXCEPTION 'Existing application RLS policies require review");
    expect(statements).not.toMatch(/(?:CREATE|ALTER|DROP)\s+EVENT\s+TRIGGER|rls_auto_enable|DROP POLICY/i);
  });

  it("keeps the learning tables behind forced RLS before integration use", () => {
    const learningMigration = readFileSync("drizzle/migrations/0005_force_learning_rls.sql", "utf8");
    const journal = JSON.parse(readFileSync("drizzle/migrations/meta/_journal.json", "utf8"));
    expect(journal.entries.at(-1)).toEqual({ idx: 5, version: "7", when: 1791630000002, tag: "0005_force_learning_rls", breakpoints: true });
    for (const name of ["learning_goals", "competencies", "practice_exercises", "practice_evaluations"]) {
      expect(learningMigration).toContain(`ALTER TABLE "public"."${name}" FORCE ROW LEVEL SECURITY`);
    }
  });
});
